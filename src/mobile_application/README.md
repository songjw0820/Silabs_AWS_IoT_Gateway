# Mobile application

Use below command in mobile_application directory to build the app:

1. Run `npm install` command in mobile_application directory (to install all packages listed in package.json)
1. `npm install -g @aws-amplify/cli` (needed of the first time set up for each system)
1. `amplify configure` (needed to setup/update amplify account congfiguration needed once not every time for each system)
1. `amplify init` (initializes project in amplify aws console,needed only once over the project/if amplify account changes - not to be done in each system - once project created in amplify no need of this)

   Enter below details for amplify initialization:
   >     ? Enter a name for the project mobileapplicationcod
   >     ? Enter a name for the environment dev
   >     ? Choose your default editor: IntelliJ IDEA
   >     ? Choose the type of app that you're building javascript
   >     Please tell us about your project
   >     ? What javascript framework are you using react-native
   >     ? Source Directory Path:  /
   >     ? Distribution Directory Path: /
   >     ? Build Command:  npm build .
   >     ? Start Command: npm start .
   >     Using default provider  awscloudformation
   >
   >     ? Do you want to use an AWS profile? Yes
   >     ? Please choose the profile you want to use default

1. `amplify add auth` (need to add authentication for amplify - only once - not system dependent if it is pushed to amplify after adding )

   Enter below details:
   >     Do you want to use the default authentication and security configuration? Default configuration
   >     Warning: you will not be able to edit these selections.
   >     How do you want users to be able to sign in? Username
   >     Do you want to configure advanced settings? No, I am done.
   >     Successfully added resource mobileapplicationcod1bc494b0 locally

1. Check the status:

   `amplify status` (to view status)

1. `amplify push` (done when evern new resources are added to local else not needed.If application fresh setup is done the need to do amplify pull instead of push as it is already done of this aws acc.)

1. - After that re-build the app from android studio build option.
     >   Build -> Rebuild Project
   - Run `npm build .`  command.
   - Run `npm start .`
   - From another terminal, Run `react-native run-android` command.
