# Mobile application

Used below command in mobile_application directory to build the app:

- "npm install -g @aws-amplify/cli"
- "amplify configure"
- "amplify init"
       Enter below details for amplify initialization:
         ? Enter a name for the project mobileapplicationcod
         ? Enter a name for the environment dev
         ? Choose your default editor: IntelliJ IDEA
         ? Choose the type of app that you're building javascript
         Please tell us about your project
         ? What javascript framework are you using react-native
         ? Source Directory Path:  /
         ? Distribution Directory Path: /
         ? Build Command:  npm build .
         ? Start Command: npm start .
         Using default provider  awscloudformation
    
         ? Do you want to use an AWS profile? Yes
         ? Please choose the profile you want to use default
    
- "amplify add auth"
       Enter below details:
         Do you want to use the default authentication and security configuration? Default configuration
         Warning: you will not be able to edit these selections.
         How do you want users to be able to sign in? Username
         Do you want to configure advanced settings? No, I am done.
         Successfully added resource mobileapplicationcod1bc494b0 locally
    
Check the status:

- "amplify status"
- "amplify push"

Run "npm install" command in mobile_application directory.

- After that re-build the app from android studio build option.
         Build -> Rebuild Project
- Run "npm build ."  command.
- Run "npm start ."
- From another terminal, Run "react-native run-android" command.


