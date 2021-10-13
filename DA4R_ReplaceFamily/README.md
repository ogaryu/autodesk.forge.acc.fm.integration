# designautomation.revit - Revit Appbundle sample

![Platforms](https://img.shields.io/badge/Plugins-Windows-lightgray.svg)
![.NET](https://img.shields.io/badge/.NET%20Framework-4.8-blue.svg)
[![Revit](https://img.shields.io/badge/Revit-2022-lightblue.svg)](http://developer.autodesk.com/)

![Advanced](https://img.shields.io/badge/Level-Advanced-blue.svg)

# Description

1. Open a Revit project.
2. Deserialize the JSON data.
   - UniqueId of the family instance to be exchanged
   - Family type name of the family to exchange
3. Load the family into the project.
4. Temporarily save the location, Transform, and MEP connector connection status of the existing family instance.
5. Retrieve and activate the family type.
6. Delete an existing family instance.
7. Create a new family instance.
8. Apply Transform.
9. Restore the connection state of the MEP connector.
10. Save the project.

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