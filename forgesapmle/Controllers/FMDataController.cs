using Autodesk.Forge;
using Autodesk.Forge.Model;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using RestSharp;
using System;
using System.Text;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Data.SQLite;

namespace forgeSample.Controllers
{
    public class FMDataController : ControllerBase
    {
        /// <summary>
        /// Credentials on this request
        /// </summary>
        private Credentials Credentials { get; set; }

        /// <summary>
        /// Start a new workitem
        /// </summary>
        [HttpPost]
        [Route("api/forge/revit_fm/upsert_assets")]
        public async Task<IActionResult> UpsertAssets([FromForm] InputData input)
        {
            try
            {
                Credentials = await Credentials.FromSessionAsync(base.Request.Cookies, Response.Cookies);
                if (Credentials == null) { return null; }

                JObject bodyJson = JObject.Parse(input.data);

                SQLiteConnectionStringBuilder builder = new SQLiteConnectionStringBuilder();

                // builder.DataSource = @"C:\Users\ogasawr\GitHub Repo\Learn Autodesk Forge\NET Core\learn.forge.viewhubmodels\db\fm_assets.db";
                builder.DataSource = @".\db\fm_assets.db";

                using (SQLiteConnection conn = new SQLiteConnection(builder.ConnectionString))
                {
                    List<Asset> assets = JsonConvert.DeserializeObject<List<Asset>>(bodyJson["assets"].ToString());

                    if (assets.Count > 0)
                    {
                        conn.Open();

                        using (var transaction = conn.BeginTransaction())
                        {

                            foreach (Asset asset in assets)
                            {
                                using (SQLiteCommand cmd = conn.CreateCommand())
                                {
                                    cmd.CommandText = "SELECT * FROM assets WHERE id = @id";

                                    cmd.Parameters.Add(new SQLiteParameter("@id", asset.Id));

                                    cmd.Prepare();

                                    var reader = cmd.ExecuteReader();

                                    if (reader.HasRows)
                                    {
                                        reader.Close();

                                        // update
                                        cmd.CommandText = "UPDATE assets SET model_id = @model_id, name = @name, revit_guid = @revit_guid, category = @category,location = @location, type_name = @type_name WHERE id = @id";
                                        cmd.Parameters.Add(new SQLiteParameter("@model_id", asset.ModelId));
                                        cmd.Parameters.Add(new SQLiteParameter("@name", asset.Name));
                                        cmd.Parameters.Add(new SQLiteParameter("@revit_guid", asset.RevitGuid));
                                        cmd.Parameters.Add(new SQLiteParameter("@category", asset.Category));
                                        cmd.Parameters.Add(new SQLiteParameter("@location", asset.Location));
                                        cmd.Parameters.Add(new SQLiteParameter("@type_name", asset.TypeName));

                                        cmd.ExecuteNonQuery();
                                    }
                                    else
                                    {
                                        reader.Close();

                                        // insert
                                        cmd.CommandText = "INSERT INTO assets(id, model_id, name, revit_guid, category, location, type_name) VALUES(@id, @model_id, @name, @revit_guid, @category, @location, @type_name)";
                                        cmd.Parameters.Add(new SQLiteParameter("@id", asset.Id));
                                        cmd.Parameters.Add(new SQLiteParameter("@model_id", asset.ModelId));
                                        cmd.Parameters.Add(new SQLiteParameter("@name", asset.Name));
                                        cmd.Parameters.Add(new SQLiteParameter("@revit_guid", asset.RevitGuid));
                                        cmd.Parameters.Add(new SQLiteParameter("@category", asset.Category));
                                        cmd.Parameters.Add(new SQLiteParameter("@location", asset.Location));
                                        cmd.Parameters.Add(new SQLiteParameter("@type_name", asset.TypeName));

                                        cmd.ExecuteNonQuery();
                                    }
                                }
                            }
                            transaction.Commit();
                        }

                        conn.Close();
                    }
                }

                return Ok();
            }
            catch (Exception e)
            {
                return Ok();
            }
        }

        public static async Task<JArray> GetAssetsFromFMDB(JObject bodyJson)
        {
            JArray assetArray = new JArray();

            await Task.Run(() =>
            {
                try
                {
                    SQLiteConnectionStringBuilder builder = new SQLiteConnectionStringBuilder();

                    builder.DataSource = @".\db\fm_assets.db";

                    using (SQLiteConnection conn = new SQLiteConnection(builder.ConnectionString))
                    {
                        List<Asset> assets = JsonConvert.DeserializeObject<List<Asset>>(bodyJson["assets"].ToString());

                        if (assets.Count > 0)
                        {
                            conn.Open();

                            foreach (Asset asset in assets)
                            {
                                using (SQLiteCommand cmd = conn.CreateCommand())
                                {
                                    cmd.CommandText = "SELECT * FROM assets WHERE revit_guid = @revit_guid";

                                    cmd.Parameters.Add(new SQLiteParameter("@revit_guid", asset.RevitGuid));

                                    cmd.Prepare();

                                    var reader = cmd.ExecuteReader();

                                    if (reader.HasRows)
                                    {
                                        while (reader.Read())
                                        {
                                            string assetRevitGuid = reader["revit_guid"].ToString();
                                            string assetId = reader["id"].ToString();

                                            dynamic assetObj = new JObject();

                                            assetObj.AssetRevitGuid = assetRevitGuid;
                                            assetObj.AssetId = assetId;

                                            assetArray.Add(assetObj);
                                        }
                                    }

                                    reader.Close();
                                }
                            }

                            conn.Close();
                        }
                    }
                }
                catch (Exception e)
                {
                }
            });

            return assetArray;
        }

        [HttpGet]
        [Route("api/forge/revit_fm/maintenance_records")]
        public async Task<JArray> GetMaintenanceRecordsFromFMDB([FromQuery]string projectId, [FromQuery] string itemId)
        {
            JArray maintenanceRecordArray = new JArray();

            string modelId = "https://developer.api.autodesk.com/data/v1/projects/" + projectId + "/items/" + itemId;

            await Task.Run(() =>
            {
                try
                {
                    SQLiteConnectionStringBuilder builder = new SQLiteConnectionStringBuilder();

                    builder.DataSource = @".\db\fm_assets.db";

                    using (SQLiteConnection conn = new SQLiteConnection(builder.ConnectionString))
                    {
                        if (modelId.Length > 0)
                        {
                            conn.Open();

                            using (SQLiteCommand cmd = conn.CreateCommand())
                            {
                                cmd.CommandText = "SELECT * FROM maintenance WHERE model_id = @model_id";

                                cmd.Parameters.Add(new SQLiteParameter("@model_id", modelId));

                                cmd.Prepare();

                                var reader = cmd.ExecuteReader();

                                if (reader.HasRows)
                                {
                                    while (reader.Read())
                                    {
                                        string reportId = reader["report_id"].ToString();
                                        string assetId = reader["asset_id"].ToString();
                                        string modelId = reader["model_id"].ToString();
                                        string assetRevitGuid = reader["revit_guid"].ToString();
                                        string priority = reader["priority"].ToString();
                                        string status = reader["status"].ToString();
                                        string title = reader["title"].ToString();
                                        string assetName = reader["asset_name"].ToString();
                                        string description = reader["description"].ToString();
                                        string reporter = reader["reporter"].ToString();
                                        string assignee = reader["assignee"].ToString();
                                        string creadateDate = reader["created_at"].ToString();
                                        string updatedDate = reader["updated_at"].ToString();

                                        dynamic reportObj = new JObject();

                                        reportObj.reportId = reportId;
                                        reportObj.assetId = assetId;
                                        reportObj.modelId = modelId;
                                        reportObj.assetRevitGuid = assetRevitGuid;
                                        reportObj.priority = priority;
                                        reportObj.status = status;
                                        reportObj.title = title;
                                        reportObj.assetName = assetName;
                                        reportObj.description = description;
                                        reportObj.reporter = reporter;
                                        reportObj.assignee = assignee;
                                        reportObj.creadateDate = creadateDate;
                                        reportObj.updatedDate = updatedDate;

                                        maintenanceRecordArray.Add(reportObj);
                                    }
                                }

                                reader.Close();
                            }

                            conn.Close();
                        }
                    }
                }
                catch (Exception e)
                {
                }
            });

            return maintenanceRecordArray;

        }

        /// <summary>
        /// Start a new workitem
        /// </summary>
        [HttpPost]
        [Route("api/forge/fm_revit/create_report")]
        public async Task<IActionResult> CreateMaintenanceReport([FromForm] InputData input)
        {
            try
            {
                Credentials = await Credentials.FromSessionAsync(base.Request.Cookies, Response.Cookies);
                if (Credentials == null) { return null; }

                JObject bodyJson = JObject.Parse(input.data);

                SQLiteConnectionStringBuilder builder = new SQLiteConnectionStringBuilder();

                builder.DataSource = @".\db\fm_assets.db";

                using (SQLiteConnection conn = new SQLiteConnection(builder.ConnectionString))
                {
                    MaintenanceReport report = JsonConvert.DeserializeObject<MaintenanceReport>(bodyJson.ToString());

                    conn.Open();

                    using (var transaction = conn.BeginTransaction())
                    {
                        using (SQLiteCommand cmd = conn.CreateCommand())
                        {
                            cmd.CommandText = "INSERT INTO maintenance(model_id, title, asset_name, asset_id, revit_guid, description, priority, status) VALUES(@model_id, @title, @asset_name, @asset_id, @revit_guid, @description, @priority, @status)";
                            cmd.Parameters.Add(new SQLiteParameter("@model_id", report.ModelId));
                            cmd.Parameters.Add(new SQLiteParameter("@title", report.Title));
                            cmd.Parameters.Add(new SQLiteParameter("@asset_name", report.AssetName));
                            cmd.Parameters.Add(new SQLiteParameter("@asset_id", report.AssetId));
                            cmd.Parameters.Add(new SQLiteParameter("@revit_guid", report.RevitGuid));
                            cmd.Parameters.Add(new SQLiteParameter("@description", report.Description));
                            cmd.Parameters.Add(new SQLiteParameter("@priority", report.Priority));
                            cmd.Parameters.Add(new SQLiteParameter("@status", "Open"));

                            cmd.ExecuteNonQuery();
                        }

                        transaction.Commit();
                    }

                    conn.Close();
                }

                return Ok();
            }
            catch (Exception e)
            {
                return Ok();
            }
        }

        public class InputData
        {
            public string data { get; set; }
        }


        [JsonObject]
        class Asset
        {
            [JsonProperty("id")]
            public string Id { get; set; }
            [JsonProperty("model_id")]
            public string ModelId { get; set; }
            [JsonProperty("name")]
            public string Name { get; set; }
            [JsonProperty("revit_guid")]
            public string RevitGuid { get; set; }
            [JsonProperty("category")]
            public string Category { get; set; }
            [JsonProperty("location")]
            public string Location { get; set; }
            [JsonProperty("type_name")]
            public string TypeName { get; set; }

        }

        [JsonObject]
        class MaintenanceReport
        {
            [JsonProperty("modelId")]
            public string ModelId { get; set; }
            [JsonProperty("assetName")]
            public string AssetName { get; set; }
            [JsonProperty("revitGuid")]
            public string RevitGuid { get; set; }
            [JsonProperty("assetId")]
            public string AssetId { get; set; }
            [JsonProperty("title")]
            public string Title { get; set; }
            [JsonProperty("description")]
            public string Description { get; set; }
            [JsonProperty("priority")]
            public string Priority { get; set; }
        }
    }
}
