import { production, qa } from './../app.json';

export const LOCAL_WEB_APP_URL = 'http://10.110.7.246:8082/api';
export const LOCAL_WEBSOCKET_URL = 'http://10.110.7.246:5000/growhouse-websocket';

export const AZURE_VM_URL = 'http://23.96.18.150:4200/api'; // for devlopement purpose

export const QA_VM_URL = 'http://23.96.18.150:8082/api'; // for QA purpose

export const VM_URL = qa ? QA_VM_URL : AZURE_VM_URL;

export const PRODUCTION_WEBSOCKET_URL = 'http://23.96.18.150:5000/growhouse-websocket';

export const LIVE_CHART_HIDS = '0933bc4b7ba3ef75f0574750ddf8e2440af40ee2-9d2c83029ea635046a40d16d294c5045f8522e7b';

export const WEB_SOCKET_URL = production ? PRODUCTION_WEBSOCKET_URL : LOCAL_WEBSOCKET_URL;

export const BASE_URL = production ? VM_URL : LOCAL_WEB_APP_URL;

export const API_ID = 'r1dlsp36ul'
export const REGION= 'us-east-1'
export const STAGE_NAME= 'dev'
export const AWS_BASE_URL=`https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}`

export const DELETE_GROWAREA = AWS_BASE_URL + '/deletething';
export const GET_USER= AWS_BASE_URL + '/getuser/';
export const RENAME_GATEWAY_SENSOR=AWS_BASE_URL + '/renamedevice';

export const EMBEDDED_BASE_URL = 'https://d1o8a43pfnmvbw.cloudfront.net/index.html';
export const USER_ARN = 'arn:aws:quicksight:us-east-1:454143665149';
export const APIG_URL = 'https%3A%2F%2Ftahln9rxsh.execute-api.us-east-1.amazonaws.com%2Fprod%2FgetDashboardEmbedURL%3F';
export const TEMPERATURE_DASHBOARD = 'a05fee11-069a-4572-bfce-77b1c3f489bb';
export const HUMIDITY_DASHBOARD = '7517a001-605c-4e1c-8618-d353f80a8644';
export const CO2_DASHBOARD = '2351b183-81d7-4ebe-8cd9-5d121ce53c64';
export const PIR_DASHBOARD = 'a9917587-892e-4833-a751-6d8fc62884c5';
export const ALL_DASHBOARD = '69f3d390-b095-435d-b9ba-469e287fc573';

export const GET_SERVER_VERSION = BASE_URL + '/release/version';
export const GET_ALL_FACILITIES = BASE_URL + '/facilities';
export const GET_ALL_CONTAINERS = BASE_URL + '/containers';
export const GET_ALL_GROW_AREAS = BASE_URL + '/growareas';
export const GET_ALL_GROW_AREA_TYPES = BASE_URL + '/growareatypes';
export const GET_ALL_GROW_AREA_COUNTS = BASE_URL + '/count/bygrowarea';
export const GET_ALL_DEVICE_TYPES = BASE_URL + '/devicetypes';
export const GET_ALL_GROW_SECTIONS = BASE_URL + '/growsections';
export const GET_ALL_DEVICES = BASE_URL + '/devices';
export const GET_ALL_USERS = BASE_URL + '/users';
export const VERIFY_USER = BASE_URL + '/users/token';
export const INTERNAL_GATEWAY_REGISTRATION_URL = BASE_URL + '/growareas';
export const INTERNAL_DEVICE_REGISTRATION_URL = BASE_URL + '/devices';
export const DELETE_ASSIGNEE_GROWAREA = BASE_URL + '/growareas/assignee';
//export const DELETE_GROWAREA = BASE_URL + '/growareas';
export const DELETE_DEVICE = BASE_URL + '/devices';
export const GET_DASHBOARD_COUNT = BASE_URL + '/count';
export const GET_DASHBOARD_ALERT = BASE_URL + '/profilealert/user'

export const ARROW_DEV01_BASE_URL = 'https://api-growhouse.konexios.io'
export const ARROW_MQTT_BASE_URL = 'ssl://mqtt-growhouse.konexios.io:8883';
export const ARROW_MQTT_VHost = '/pegasus';

export const ARROW_BASE_URL = ARROW_DEV01_BASE_URL

export const ARROW_X_AUTH_TOKEN = '6c4f0d9ce110636633601e1e08ac59c58a72d85fee9315efb4395d9a7cc05746';

export const ARROW_APPLICATION_HID = '42394c73d2278f51d1b7f7347e9af50fe62202d6';

export const ARROW_GATEWAY_REGISTRATION_URL = ARROW_BASE_URL + '/api/v1/kronos/gateways';
export const ARROW_GATEWAY_CONFIG_GET_URL = ARROW_BASE_URL + '/api/v1/kronos/gateways/{0}/config';

export const GET_LEDNODE_GROUP_LIST = BASE_URL + '/lednode/group/growarea';
export const FIND_DEVICES_FOR_GROUP = BASE_URL + '/lednode/group/devices/gateway';
export const CREATE_LED_GROUP = BASE_URL + '/lednode/group';
export const UPDATE_LED_GROUP = BASE_URL + '/lednode/group';
export const DELETE_LED_GROUP = BASE_URL + '/lednode/group';
export const GET_INDIVIDUAL_GROUP = BASE_URL + '/lednode/group';

export const CREATE_GROUP_PROFILE = BASE_URL + '/lednode/group/profile'
export const GET_LEDNODE_GROUP_PROFILE_LIST = BASE_URL + '/lednode/group';
export const DELETE_EVENT = BASE_URL + '/lednode/group/profile/event';
export const DELETE_ALL_PROFILES = BASE_URL + '/devices/ledNode/Profile/gateway';
export const DELETE_ALL_DESIRED_VALUE = BASE_URL + '/devices/ledNode/desiredValue/gateway';
export const DELETE_ALL_CHANNEL_CONFIG = BASE_URL + '/devices/ledNode/channelConfig/gateway';
export const DELETE_ALL_MAPPING = BASE_URL + '/devices/propertyMapping/gateway';
export const DELETE_DEVICE_SECTION = BASE_URL + '/devices/section/gateway';
export const DELETE_DEVICE_GATEWAY = BASE_URL + '/devices/gateway';
export const DELETE_ALL_PROFILE_ALERTS = BASE_URL + '/profilealert/gateway';
export const DELETE_ALL_GROWAREA_PROFILE = BASE_URL + '/profile/growarea';
export const DELETE_ALL_GROW_SECTION = BASE_URL + '/growsections/growSection';
export const DELETE_GROWAREA_GROUPS = BASE_URL + '/lednode/gateway'


