
import GrowAreasScreen from './src/screens/GrowAreas';
import DevicesScreen from './src/screens/Devices';
import LoginScreen from './src/screens/Login';
import SideDrawer from './src/screens/SideDrawer';
import PublishScreen from './src/screens/PublishData';
import { AsyncStorage, Alert } from 'react-native';
import { Navigation } from 'react-native-navigation';
import * as Constant from './src/Constant';
import { debug, allowExceptionsInDevMode } from './app.json';
import configureStore from "./src/store/configureStore";
import { Provider } from "react-redux";
import Icon from 'react-native-vector-icons/Ionicons';
import RNRestart from 'react-native-restart'; // Import package from node modules 
import Dashboard from './src/screens/Dashboard';
import { setJSExceptionHandler, setNativeExceptionHandler } from 'react-native-exception-handler';
import { Platform } from 'react-native';

let tabCount = 0;
let position = false;



const store = configureStore();

Navigation.registerComponentWithRedux('GrowAreasScreen', () => GrowAreasScreen, Provider, store);

Navigation.registerComponentWithRedux('DevicesScreen', () => DevicesScreen, Provider, store);

Navigation.registerComponentWithRedux('LoginScreen', () => LoginScreen, Provider, store);

Navigation.registerComponentWithRedux('SideDrawer', () => SideDrawer, Provider, store);

Navigation.registerComponentWithRedux('DashboardScreen', () => Dashboard, Provider, store);

Navigation.registerComponentWithRedux('PublishScreen', () => PublishScreen, Provider, store);


const forceAppQuit = false;
const executeDefaultHandler = true;

const jsExceptionhandler = (error, isFatal) => {
  if (isFatal) {
    console.log("\n\n\n\n\nJSExceptionHandler:" + error);
  } else {
    console.log("\n\n\n\n\nJSExceptionHandler:" + error); // So that we can see it in the ADB logs in case of Android if needed
  }
  // This is your custom global error handler
  // You do stuff like show an error dialog
  // or hit google analytics to track crashes
  // or hit a custom api to inform the dev team.
};
setJSExceptionHandler(jsExceptionhandler, allowExceptionsInDevMode);
// - exceptionhandler is the exception handler function
// - allowInDevMode is an optional parameter is a boolean.
//   If set to true the handler to be called in place of RED screen
//   in development mode also.

const nativeExceptionhandler = exceptionString => {
  console.log("\n\n\n\n\nNative Exception:" + exceptionString);
  return {}
  // This is your custom global error handler
  // You do stuff likehit google analytics to track crashes.
  // or hit a custom api to inform the dev team.
  //NOTE: alert or showing any UI change via JS
  //WILL NOT WORK in case of NATIVE ERRORS.
};

setNativeExceptionHandler(
  nativeExceptionhandler,
  forceAppQuit,
  executeDefaultHandler
);

// - exceptionhandler is the exception handler function
// - forceAppQuit is an optional ANDROID specific parameter that defines
//    if the app should be force quit on error.  default value is true.
//    To see usecase check the common issues section.
// - executeDefaultHandler is an optional boolean (both IOS, ANDROID)
//    It executes previous exception handlers if set by some other module.
//    It will come handy when you use any other crash analytics module along with this one
//    Default value is set to false. Set to true if you are using other analytics modules.


export default (pageIndex) => {
  Navigation.setDefaultOptions({
    bottomTabs: {
      hideShadow: true,
      backgroundColor: 'white'
    },
    layout: {
      orientation: 'portrait'
    }
  });
  Promise.all([
    AsyncStorage.getItem('accessToken'),
    Icon.getImageSource("ios-menu", 30)
  ]).then(sources => {
    if (!sources[0]) {
      Navigation.setRoot({
        root: {
          component: {
            name: 'LoginScreen'
          }
        }
      });

    } else {
      startTABBasedNavigation(pageIndex, sources[1]);

    }
  });
}


const startTABBasedNavigation = (pageIndex, iconSrc) => {
  let index = pageIndex ? pageIndex : 0;
  Navigation.setRoot({
    root: {
      sideMenu: {
        id: 'SideMenu',
        left: {
          component: {
            id: 'sideDrawer',
            name: 'SideDrawer',
          },
        },
        center: {
          root: {

          },
          bottomTabs: {
            id: 'BottomTabsId',
            children: [
             
              {
                stack: {
                  id: 'CONTAINER',
                  children: [{
                    component: {
                      name: 'DashboardScreen',
                      options: {
                        bottomTab: {
                          text: 'Dashboards',
                          icon: require('./assets/images/dashboard_grey.png'),
                          iconColor:'#000000',
                          selectedIconColor: Constant.TABBAR_BUTTON_SELECTED_COLOR,
                          textColor:'#000000',
                          selectedTextColor: Constant.TABBAR_BUTTON_SELECTED_COLOR,
                        },
                        popGesture: true,
                        topBar: {
                          title: {
                            text: 'Dashboard',
                          },
                          leftButtons: [
                            {
                              id: "sideDrawer",
                              icon: iconSrc,
                              title: 'Menu',
                              color: 'white'
                            }
                          ]
                        },
                        sideMenu: {
                          left: {
                            visible: false,
                            enabled: Platform.OS === 'android',
                          }

                        }
                      }
                    }
                  }]
                }
              },
              {
                stack: {
                  id: 'GROWAREA',
                  children: [{
                    component: {
                      name: 'GrowAreasScreen',
                      options: {
                        bottomTab: {
                          text: 'Gateway',
                          icon: require('./assets/images/growarea.png'),
                          //iconColor: Constant.TABBAR_BUTTON_COLOR,
                          iconColor:'#000000',
                          selectedIconColor: Constant.TABBAR_BUTTON_SELECTED_COLOR,
                         // textColor: Constant.TABBAR_BUTTON_COLOR,
                          textColor:'#000000',
                          selectedTextColor: Constant.TABBAR_BUTTON_SELECTED_COLOR,
                        },
                        popGesture: true,
                        topBar: {
                          title: {
                            text: 'My Gateways',
                          },
                          leftButtons: [
                            {
                              id: "sideDrawer",
                              icon: iconSrc,
                              title: 'Menu',
                              color: 'white'
                            }
                          ]
                        },
                        sideMenu: {
                          left: {
                            visible: false,
                            enabled: Platform.OS === 'android',
                          }

                        }
                      }
                    }
                  }]
                }
              },
             
              {
                stack: {
                  id: 'DEVICES',
                  children: [{
                    component: {
                      name: 'DevicesScreen',
                      options: {
                        bottomTab: {
                          text: 'Sensors',
                          icon: require('./assets/images/device_72.png'),
                          //iconColor: Constant.TABBAR_BUTTON_COLOR,
                          iconColor:'#000000',
                          selectedIconColor: Constant.TABBAR_BUTTON_SELECTED_COLOR,
                          //textColor: Constant.TABBAR_BUTTON_COLOR,
                          textColor:'#000000',
                          selectedTextColor: Constant.TABBAR_BUTTON_SELECTED_COLOR,
                        },
                        popGesture: true,
                        topBar: {
                          title: {
                            text: 'My Sensors',
                          },
                          leftButtons: [
                            {
                              id: "sideDrawer",
                              icon: iconSrc,
                              title: 'Menu',
                              color: 'white'
                            }
                          ]
                        },
                        sideMenu: {
                          left: {
                            visible: false,
                            enabled: Platform.OS === 'android',
                          }

                        }
                      },

                    },

                  }
                  ]
                }
              },
              {
                stack: {
                  id: 'PUBLISH',
                  children: [{
                    component: {
                      name: 'PublishScreen',
                      options: {
                        bottomTab: {
                          text: 'Publish Data',
                          icon: require('./assets/images/growsection.png'),
                          //iconColor: Constant.TABBAR_BUTTON_COLOR,
                          iconColor:'#000000',
                          selectedIconColor: Constant.TABBAR_BUTTON_SELECTED_COLOR,
                          //textColor: Constant.TABBAR_BUTTON_COLOR,
                          textColor:'#000000',
                          selectedTextColor: Constant.TABBAR_BUTTON_SELECTED_COLOR,
                        },
                        popGesture: true,
                        topBar: {
                          title: {
                            text: 'Publish data',
                          },
                          leftButtons: [
                            {
                              id: "sideDrawer",
                              icon: iconSrc,
                              title: 'Menu',
                              color: 'white'
                            }
                          ]
                        },
                        sideMenu: {
                          left: {
                            visible: false,
                            enabled: Platform.OS === 'android',
                          }

                        }
                      },

                    },

                  }
                  ]
                }
              },
            ],
            options: {
              bottomTabs: {
                hideShadow: true,
                currentTabIndex: index,
                backgroundColor: 'white'

              },
              popGesture: true,
              topBar: {
                visible: true,
                hideOnScroll: true,
                drawBehind: true,
                background: {
                 // color: '#00ff00',
                  color: '#ff9900',
                },
              },
              layout: {
                orientation: ['portrait'] // An array of supported orientations
              },
            },
          },
        },
      },
    },
    options: {
      layout: {
        orientation: ['portrait'],
      },
    }
  });
}

Navigation.events().registerBottomTabSelectedListener(async (res) => {
  let currentTabIndex = 0;
  try {
    tabCount++;
    setTimeout(() => {
      tabCount = 0;
    }, 1000)
    if (tabCount === 2) {
      tabCount = 0;
      if (res.selectedTabIndex === res.unselectedTabIndex) {
        currentTabIndex = res.selectedTabIndex;        
        await Navigation.popToRoot(Constant.rootStack[res.selectedTabIndex]);
      }
    }
  } catch (error) {
    if (error.message === 'Nothing to pop') {
      Icon.getImageSource("ios-menu", 30).then((src) => {
        startTABBasedNavigation(currentTabIndex, src);
      });
    }
  }
});


Navigation.events().registerNavigationButtonPressedListener((res) => {
  position = !position
  Platform.OS === 'ios' ?
    Navigation.mergeOptions(res.componentId, {
      sideMenu: {
        left: {
          visible: position,
          enabled: false,
        }
      }
    })
    :
    Navigation.mergeOptions(res.componentId, {
      sideMenu: {
        left: {
          visible: true,
          enabled: true
        }
      }
    })
})