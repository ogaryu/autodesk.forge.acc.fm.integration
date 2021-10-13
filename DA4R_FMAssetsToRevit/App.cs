#region Namespaces
using System;
using System.Collections.Generic;
using System.IO;
using Autodesk.Revit.ApplicationServices;
using Autodesk.Revit.Attributes;
using Autodesk.Revit.DB;
using DesignAutomationFramework;
using Newtonsoft.Json;
#endregion

namespace DA4R_FMAssetsToRevit
{
    class App : IExternalDBApplication
    {
        public ExternalDBApplicationResult OnStartup(Autodesk.Revit.ApplicationServices.ControlledApplication app)
        {
            DesignAutomationBridge.DesignAutomationReadyEvent += HandleDesignAutomationReadyEvent;
            return ExternalDBApplicationResult.Succeeded;
        }

        public ExternalDBApplicationResult OnShutdown(Autodesk.Revit.ApplicationServices.ControlledApplication app)
        {
            return ExternalDBApplicationResult.Succeeded;
        }

        public void HandleDesignAutomationReadyEvent(object sender, DesignAutomationReadyEventArgs e)
        {
            e.Succeeded = true;
            
            SyncFMAssets(e.DesignAutomationData);
        }
        public class AssetElement
        {
            public string AssetRevitGuid { get; set; }
            public string AssetId { get; set; }
        }

        public void SyncFMAssets(DesignAutomationData data)
        {
            Document doc = data.RevitDoc;
            Application app = data.RevitApp;

            List<AssetElement> assetElems = JsonConvert.DeserializeObject<List<AssetElement>>(File.ReadAllText("params.json"));

            Console.WriteLine("Debug start...");

            foreach (AssetElement assetElem in assetElems)
            {
                Console.WriteLine("Asset GUID: " + assetElem.AssetRevitGuid.ToString());

                Element elem = doc.GetElement(assetElem.AssetRevitGuid);

                Parameter param = elem.LookupParameter("AssetId");

                if(param == null)
                {
                    FamilyInstance fi = elem as FamilyInstance;

                    Family family = fi.Symbol.Family;

                    Console.WriteLine("Family name: " + family.Name);

                    try
                    {
                        Document familyDoc = doc.EditFamily(family);

                        using (Transaction tx = new Transaction(familyDoc))
                        {
                            tx.Start("Transaction Create Family Parameter");

                            FamilyParameter fmAssetIdParam = familyDoc.FamilyManager.AddParameter("AssetId", GroupTypeId.General, SpecTypeId.String.Text, true);

                            Console.WriteLine("Added Parameter Name: " + fmAssetIdParam.Definition.Name);

                            tx.Commit();
                        }

                        LoadOpts loadOptions = new LoadOpts();

                        familyDoc.LoadFamily(doc, loadOptions);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine(ex.Message);
                    }
                }
            }

            using (Transaction tx = new Transaction(doc))
            {
                tx.Start("Transaction Set AssetId");

                foreach (AssetElement assetElem in assetElems)
                {
                    Element elem = doc.GetElement(assetElem.AssetRevitGuid);

                    Console.WriteLine("Family found in current project: " + elem.Name);

                    Parameter assetIdParam = elem.LookupParameter("AssetId");
                    assetIdParam.Set(assetElem.AssetId);
                }

                tx.Commit();
            }

            SaveAsOptions options = new SaveAsOptions();
            //WorksharingSaveAsOptions worksharingOotions = options.GetWorksharingOptions();
            //worksharingOotions.SaveAsCentral = true;
            //options.SetWorksharingOptions(worksharingOotions);

            ModelPath path = ModelPathUtils.ConvertUserVisiblePathToModelPath("result.rvt");
            doc.SaveAs(path, options);

        }
    }
    class LoadOpts : IFamilyLoadOptions
    {
        public bool OnFamilyFound(bool familyInUse, out bool overwriteParameterValues)
        {
            overwriteParameterValues = true;
            return true;
        }

        public bool OnSharedFamilyFound(Family sharedFamily, bool familyInUse, out FamilySource source, out bool overwriteParameterValues)
        {
            source = FamilySource.Family;
            overwriteParameterValues = true;
            return true;
        }
    }
}
