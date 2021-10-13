#region Namespaces
using System;
using System.Linq;
using System.Collections.Generic;
using System.IO;
using Autodesk.Revit.ApplicationServices;
using Autodesk.Revit.Attributes;
using Autodesk.Revit.DB;
using Autodesk.Revit.DB.Structure;
using DesignAutomationFramework;
using Newtonsoft.Json;

#endregion

namespace DA4R_ReplaceFamily
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

            ReplaceFamily(e.DesignAutomationData);
        }

        public class InputData
        {
            public string FamilyFileName { get; set; }
            public string FamilyCategory { get; set; }
            public string FamilyTypeName { get; set; }
            public string InstanceGuid { get; set; }

        }

        public void ReplaceFamily(DesignAutomationData data)
        {
            Document doc = data.RevitDoc;
            Application app = data.RevitApp;

            InputData inputData = JsonConvert.DeserializeObject<InputData>(File.ReadAllText("params.json"));

            using (Transaction tx = new Transaction(doc))
            {
                tx.Start("Transaction Replace Family");

                LoadOpts loadOptions = new LoadOpts();

                doc.LoadFamily(Directory.GetCurrentDirectory() + @"\family.rfa", loadOptions, out Family loadedFamily);

                if (loadedFamily != null)
                {
                    Element elem = doc.GetElement(inputData.InstanceGuid);

                    FamilyInstance currentFamilyInstance = elem as FamilyInstance;

                    Family currentFamily = currentFamilyInstance.Symbol.Family;

                    if (currentFamily.FamilyPlacementType == FamilyPlacementType.OneLevelBased)
                    {
                        Level currentLevel = doc.GetElement(currentFamilyInstance.LevelId) as Level;
                        LocationPoint currentLocation = currentFamilyInstance.Location as LocationPoint;
                        XYZ currentLocationPoint = currentLocation.Point;
                        Transform currentTransform = currentFamilyInstance.GetTransform();

                        MEPModel currentMepModel = currentFamilyInstance.MEPModel;

                        ConnectorManager currentConnectorManager = currentMepModel.ConnectorManager;

                        List<SavedConnectorInfo> savedConnectorInfoList = new List<SavedConnectorInfo>();

                        foreach (Connector con in currentConnectorManager.Connectors)
                        {
                            if (currentConnectorManager.UnusedConnectors.Contains(con))
                            {
                                break;
                            }
                            else
                            {
                                SavedConnectorInfo savedConnectorInfo = new SavedConnectorInfo();

                                SavedConnector thisCon = new SavedConnector();
                                thisCon.id = con.Id;
                                thisCon.ownerId = con.Owner.Id;
                                thisCon.origin = con.Origin;
                                thisCon.connectorType = con.ConnectorType;
                                thisCon.domain = con.Domain;

                                if (con.Domain == Domain.DomainHvac || con.Domain == Domain.DomainPiping)
                                {
                                    thisCon.flowDirectionType = con.Direction;
                                }

                                savedConnectorInfo.connector = thisCon;
                                savedConnectorInfo.refConnectors = con.AllRefs;

                                savedConnectorInfoList.Add(savedConnectorInfo);
                            }
                        }

                        FamilySymbol replaceSymbol = null;

                        ISet<ElementId> symbolIds = loadedFamily.GetFamilySymbolIds();

                        foreach (ElementId symbolId in symbolIds)
                        {
                            Element familySymbol = doc.GetElement(symbolId);

                            if (familySymbol.Name == inputData.FamilyTypeName)
                            {
                                replaceSymbol = familySymbol as FamilySymbol;
                                replaceSymbol.Activate();
                            }
                        }

                        doc.Delete(currentFamilyInstance.Id);

                        doc.Regenerate();

                        FamilyInstance newInstance = doc.Create.NewFamilyInstance(XYZ.Zero, replaceSymbol, currentLevel, StructuralType.NonStructural);

                        ICollection<ElementId> elemIds = new List<ElementId>();
                        elemIds.Add(newInstance.Id);

                        ICollection<ElementId> transormedInstanceIds = ElementTransformUtils.CopyElements(doc, elemIds, doc, currentTransform, new CopyPasteOptions());

                        ElementId transormedInstanceId = transormedInstanceIds.First<ElementId>();

                        FamilyInstance transformedNewInstance = doc.GetElement(transormedInstanceId) as FamilyInstance;

                        LocationPoint newLocationPoint = transformedNewInstance.Location as LocationPoint;

                        ElementTransformUtils.MoveElement(doc, transormedInstanceId, currentLocationPoint - newLocationPoint.Point);

                        doc.Delete(newInstance.Id);

                        MEPModel transformedNewInstanceMepModel = transformedNewInstance.MEPModel;

                        ConnectorManager newInstanceConnectorManager = transformedNewInstanceMepModel.ConnectorManager;

                        foreach (Connector con in newInstanceConnectorManager.Connectors)
                        {
                            foreach (SavedConnectorInfo connectorInfo in savedConnectorInfoList)
                            {
                                if (con.Domain == Domain.DomainHvac || con.Domain == Domain.DomainPiping)
                                {
                                    if (connectorInfo.connector.flowDirectionType == con.Direction)
                                    {
                                        Connector closestConnector = GetConnectorClosestTo(connectorInfo.refConnectors, con.Origin);

                                        if (closestConnector != null)
                                        {
                                            con.ConnectTo(closestConnector);
                                        }
                                    }
                                }
                            }
                        }

                    }

                    tx.Commit();
                }
                else
                {
                    tx.RollBack();
                }
            }

            SaveAsOptions options = new SaveAsOptions();

            ModelPath path = ModelPathUtils.ConvertUserVisiblePathToModelPath("result.rvt");
            doc.SaveAs(path, options);

        }

        public Connector GetConnectorClosestTo(ConnectorSet connectors, XYZ p)
        {
            Connector targetConnector = null;
            double minDist = double.MaxValue;

            foreach (Connector c in connectors)
            {
                double d = c.Origin.DistanceTo(p);

                if (d < minDist)
                {
                    targetConnector = c;
                    minDist = d;
                }
            }
            return targetConnector;
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
        public class SavedConnector
        {
            public int id { get; set; }
            public ElementId ownerId { get; set; }
            public FlowDirectionType flowDirectionType { get; set; }
            public XYZ origin { get; set; }
            public ConnectorType connectorType { get; set; }
            public Domain domain { get; set; }
        }

        public class SavedConnectorInfo
        {
            public SavedConnector connector { get; set; }
            public ConnectorSet refConnectors { get; set; }
        }
    }
}
