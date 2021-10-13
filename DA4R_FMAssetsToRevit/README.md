# designautomation.revit - Revit Appbundle sample

![Platforms](https://img.shields.io/badge/Plugins-Windows-lightgray.svg)
![.NET](https://img.shields.io/badge/.NET%20Framework-4.8-blue.svg)
[![Revit](https://img.shields.io/badge/Revit-2022-lightblue.svg)](http://developer.autodesk.com/)

![Advanced](https://img.shields.io/badge/Level-Advanced-blue.svg)

# Description

1. Get the family instance from externalId (Uniqueid) and check if the parameter "AssetId" exists.
2. If the parameter does not exist, open the family document in the Family Editor, add the type parameter "AssetId", and reload it into the Revit project.
3. Since the "AssetId" parameter has been assigned to the family instance, set the value retrieved from the external DB.
4. Save the Revit project to complete the processing of the WorkItem and upload it to the specified location in ACC, Autodesk Docs.

# Setup

## Prerequisites

1. **Visual Studio** 2019
2. **Revit** 2022 required to compile changes into the plugin

## References

This Revit plugin requires **RevitAPI** and **DesignAutomationBridge** references. The `Reference Path` option should point to the folder.

![](../media/revit/reference_path.png)

# Further Reading

- [My First Revit Plugin](https://knowledge.autodesk.com/support/revit-products/learn-explore/caas/simplecontent/content/my-first-revit-plug-overview.html)
- [Revit Developer Center](https://www.autodesk.com/developer-network/platform-technologies/revit)

## License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT). Please see the [LICENSE](LICENSE) file for full details.

## Written by

Naveen Kumar, [Forge Partner Development](http://forge.autodesk.com)