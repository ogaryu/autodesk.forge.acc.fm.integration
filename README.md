# autodesk.forge.acc.fm.integration

## Description

This sample is part of the Autodesk Univeresity 2021 Class.

- SD500082: Autodesk Construction Cloud と Design Automation for Revit でつながる維持管理プロセス

This sample shows how to integrate a Forge application with an existing Facility Management System.

- Linking with external databases.
- Creating an issue report and view the history.
- Creating a new Revit project which includes Revit family instances to visualize on Forge Viewer.
- Replacing a family instance in a project with another family.
- Comparing two Revit model versions to check changes.

It includes 4 projects and postman collection:

- 1 .NET Core web project for Forge application. See **[readme](https://github.com/ogaryu/autodesk.forge.acc.fm.integration/tree/main/forgesapmle/)** for more information.
- 3 .NET Framework projects for Design Automation for Revit Appbundles. See each readme for details.
- **[Postman Collection](postman/)** to register appbundle and activity on Design Automation.
