#include <vector>
#include <iostream>
#include <fstream>
#include <sstream>
#include "rapidjson/document.h"
#include "rapidjson/reader.h"
#include "rapidjson/writer.h"
#include "rapidjson/prettywriter.h"
#include "rapidjson/filereadstream.h"
#include "rapidjson/filewritestream.h"
#include <curl/curl.h>
#include <sys/types.h>
#include <sys/stat.h>


#include <chrono>
#include <thread>
#include <mosquitto.h>
#include "macrologger.h"


#define THING_TYPE_GATEWAY "gateway"
#define THING_TYPE_DEVICE  "endDevice"
#define THING_TYPE_SENSOR  "sensor"
#define PATH_TO_CERTS      "/opt/awsapp/certs/"
#define CONFIG_FILE        "/opt/awsapp/config.json"

// Define DEBUG macro to enable debug logs.
// To enable DEBUG logs, uncomment the next line
//#define DEBUG

//#define CREATE_THING_ENDPOINT "http://localhost:8090/post"
//#define CREATE_THING_ENDPOINT "http://localhost:8090/postsensors"
#define CREATE_THING_ENDPOINT "https://bym6ctlh6e.execute-api.us-east-2.amazonaws.com/dev/creatething"

#define AMAZON_ROOT_CA_ENDPOINT "https://www.amazontrust.com/repository/AmazonRootCA1.pem"

class AWSIoTCore
{
	public:
		AWSIoTCore();
		std::string stringify(rapidjson::GenericValue<rapidjson::UTF8<> >& o);
		int UpdateConfigFile(const char * key, const char * value);
		int WriteToFile(const char * fileName, const char * data);
		std::string ReadConfigFile(const char * key);
		std::string CallCreateThingAPI(const char * body);
		static size_t WriteCallback(void *contents, size_t size, size_t nmemb, void *userp);
		int ParseCreateGatewayResponse(std::string response);
		rapidjson::Value ParseCreateSensorResponse(std::string response);
		int ClearConfig();
		std::string GetAmazonRootCACertificate();
		~AWSIoTCore();
	private:
		rapidjson::Document document;
};

