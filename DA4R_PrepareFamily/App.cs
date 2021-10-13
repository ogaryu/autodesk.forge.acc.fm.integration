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
#endregion

namespace DA4R_PrepareFamily
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

            PrepareFamily(e.DesignAutomationData);
        }

        public void PrepareFamily(DesignAutomationData data)
        {
            Application app = data.RevitApp;

            Document doc = app.NewProjectDocument(UnitSystem.Metric);

            using (Transaction tx = new Transaction(doc))
            {
                tx.Start("Transaction Prepare Family");

                LoadOpts loadOptions = new LoadOpts();

                doc.LoadFamily(Directory.GetCurrentDirectory() + @"\family.rfa", loadOptions, out Family loadedFamily);

                FilteredElementCollector levelCollector = new FilteredElementCollector(doc);
                Element levelElem = levelCollector.OfClass(typeof(Level)).FirstElement();

                ViewPlan viewPlan = new FilteredElementCollector(doc)
                  .OfClass(typeof(ViewPlan))
                  .Cast<ViewPlan>()
                  .Where<ViewPlan>(v => ViewType.FloorPlan == v.ViewType).First<ViewPlan>();

                FamilyInstance newInstance = null;
                XYZ placePoint = XYZ.Zero;

                if (loadedFamily != null)
                {
                    foreach (ElementId symbolId in loadedFamily.GetFamilySymbolIds())
                    {
                        FamilySymbol familySymbol = doc.GetElement(symbolId) as FamilySymbol;

                        if (newInstance != null)
                        {
                            BoundingBoxXYZ bb = newInstance.get_BoundingBox(viewPlan);

                            XYZ bbXYZ = new XYZ(XYZ.Zero.X, bb.Max.Y - bb.Min.Y, XYZ.Zero.Z);

                            LocationPoint lp = newInstance.Location as LocationPoint;

                            double clearance = (bb.Max.Y - bb.Min.Y) * 2;

                            placePoint = new XYZ(lp.Point.X, lp.Point.Y + clearance, lp.Point.Z);
                        }

                        familySymbol.Activate();

                        newInstance = doc.Create.NewFamilyInstance(placePoint, familySymbol, levelElem, StructuralType.NonStructural);

                        doc.Regenerate();
                    }

                }

                tx.Commit();
            }

            var collector = new FilteredElementCollector(doc);
            var viewFamilyType = collector.OfClass(typeof(ViewFamilyType)).Cast<ViewFamilyType>()
              .FirstOrDefault(x => x.ViewFamily == ViewFamily.ThreeDimensional);

            using (Transaction tx = new Transaction(doc, "Create 3D View"))
            {
                tx.Start();

                var view3D = View3D.CreateIsometric(doc, viewFamilyType.Id);

                view3D.DetailLevel = ViewDetailLevel.Fine;

                tx.Commit();
            }

            SaveAsOptions options = new SaveAsOptions();

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


