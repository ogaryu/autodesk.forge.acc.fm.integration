# designautomation.revit - Revit Appbundle sample

![Platforms](https://img.shields.io/badge/Plugins-Windows-lightgray.svg)
![.NET](https://img.shields.io/badge/.NET%20Framework-4.8-blue.svg)
[![Revit](https://img.shields.io/badge/Revit-2022-lightblue.svg)](http://developer.autodesk.com/)

![Advanced](https://img.shields.io/badge/Level-Advanced-blue.svg)

# Description

This sample loads a Revit family files into a new project, and place instances of each type.

1. Create a new project.
2. Load the family into the project.
3. Open the plan view.
4. Select the family type.
5. Place the family instance in the floor plan view.
6. Repeat steps 4-5 for as many as family types.
7. Create a 3D view.
8. Change the level of detail in the view.
9. Save the project.

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