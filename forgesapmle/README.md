# forge.tutorial.viewhubmodels - .NET Core

![Platforms](https://img.shields.io/badge/platform-Windows-lightgray.svg)
![.NET Core](https://img.shields.io/badge/.NET%20Core-3.1-blue.svg)
[![ASP.NET Core](https://img.shields.io/badge/ASP.NET%20Core-3.1-blue.svg)](https://asp.net/)
[![License](http://img.shields.io/:license-mit-blue.svg)](http://opensource.org/licenses/MIT)

[![oAuth2](https://img.shields.io/badge/oAuth2-v1-green.svg)](http://developer.autodesk.com/)
[![Data-Management](https://img.shields.io/badge/Data%20Management-v1-green.svg)](http://developer.autodesk.com/)
[![Model-Derivative](https://img.shields.io/badge/Model%20Derivative-v2-green.svg)](http://developer.autodesk.com/)

![Intermediate](https://img.shields.io/badge/Level-Basic-green.svg)

# Description

To run this sample, the firt step is to prepare the app bundle package.

The second step is to create Appbundle and Activity through Postman collection.
See **[readme](https://github.com/ogaryu/autodesk-forge-php-basic-sample/tree/main/postman/)** for the details.

This sample is expected to use Revit 2022 Japanese Edition sample projects and Japan RUG family.
- サンプル意匠.rvt (for Architecture) 
- サンプル構造.rvt (for Structure)
- サンプル設備.rvt (for MEP)
- 11030_FAN_消音ボックス付送風機.rfa (**[RUG Library](http://bim-design.com/rug/library/)**)

The third step is to upload these models and a family onto Autodesk Construction Cloud project.

## Demo Video

In preparation.

# Setup

## Prerequisites

1. **Forge Account**: Learn how to create a Forge Account, activate subscription and create an app at [this tutorial](http://learnforge.autodesk.io/#/account/). 
2. **Visual Studio**: Either Community (Windows) or Code (Windows, MacOS).
3. **.NET Core** basic knowledge with C#
4. **ngrok**: Routing tool, [download here](https://ngrok.com/). 

## Running locally

Clone this project or download it. It's recommended to install [GitHub desktop](https://desktop.github.com/). To clone it via command line, use the following (**Terminal** on MacOSX/Linux, **Git Shell** on Windows):

    git clone https://github.com/ogaryu/design.automation-csharp-revit.grid.object.placement.git
    
**ngrok**

When a `Workitem` completes, **Design Automation** can notify our application. As the app is running locally (i.e. `localhost`), it's not reacheable from the internet. `ngrok` tool creates a temporary address that channels notifications to our `localhost` address.

After [download ngrok](https://ngrok.com/), run `ngrok http 3000 -host-header="localhost:3000"`, then copy the `http` address into the `FORGE_WEBHOOK_URL` environment variable (see next). For this sample, do not use the `https` address.

![](../media/webapp/ngrok_setup.png)

**Visual Studio** (Windows):

Right-click on the project, then go to **Debug**. Adjust the settings as shown below. 

![](../media/webapp/visual_studio_settings.png)

**Visual Sutdio Code** (Windows):

Open the `webapp` folder (only), at the bottom-right, select **Yes** and **Restore**. This restores the packages (e.g. Autodesk.Forge) and creates the launch.json file.

![](../media/webapp/visual_code_restore.png)

At the `.vscode\launch.json`, find the env vars and add your Forge Client ID, Secret and callback URL. Also define the `ASPNETCORE_URLS` variable. The end result should be as shown below:

```json
"env": {
    "ASPNETCORE_ENVIRONMENT": "Development",
    "ASPNETCORE_URLS" : "http://localhost:3000",
    "FORGE_CLIENT_ID": "your id here",
    "FORGE_CLIENT_SECRET": "your secret here",
    "FORGE_WEBHOOK_URL": "http://1234.ngrok.io",
    "FORGE_NICKNAME": "your nickname here"
},
```

# Further Reading

Documentation:

- [Design Automation v3](https://forge.autodesk.com/en/docs/design-automation/v3/developers_guide/overview/)
- [Data Management](https://forge.autodesk.com/en/docs/data/v2/reference/http/) used to store input and output files.
- [Forge Viewer](https://forge.autodesk.com/en/docs/viewer/v7/developers_guide/overview/)

Other APIs:

- [.NET Core SignalR](https://docs.microsoft.com/en-us/aspnet/core/signalr/introduction?view=aspnetcore-2.2)
### Troubleshooting

1. **Cannot see my ACC projects**: Make sure to provision the Forge App Client ID within the ACC Account, [learn more here](https://forge.autodesk.com/blog/bim-360-docs-provisioning-forge-apps). This requires the Account Admin permission.

2. **error setting certificate verify locations** error: may happen on Windows, use the following: `git config --global http.sslverify "false"`

## License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT). Please see the [LICENSE](LICENSE) file for full details.

## Written by

Augusto Goncalves [@augustomaia](https://twitter.com/augustomaia), [Forge Partner Development](http://forge.autodesk.com)