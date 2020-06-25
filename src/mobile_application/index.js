import App from './App';
import { Navigation } from "react-native-navigation";

Navigation.events().registerAppLaunchedListener(() => {
    App();
});