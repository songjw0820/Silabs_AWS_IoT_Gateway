#include "aws-iot-core-class.hpp"

/**
* @brief Read the config file  and return the key-value.
*
* @param key - to be read
*
* @return value of the key in Aws::String type.
*/
std::string AWSIoTCore::ReadConfigFile(const char * key)
{
	rapidjson::Document data;
	FILE* fp = fopen(CONFIG_FILE, "r+");
        char readBuffer[65536];

        rapidjson::FileReadStream is(fp, readBuffer, sizeof(readBuffer));
        data.ParseStream(is);
        fclose(fp);
	std::string result = data[key].GetString();
	return result;

}
/**
* @brief Update the config file's key and value
*
* @param key - to be updated
* @param value - the new modified value to be stored.
*
* @return 
*/
int AWSIoTCore::UpdateConfigFile(const char * key, const char * value)
{
	rapidjson::Document data;
        std::ofstream outfile;
	
	FILE* fp = fopen(CONFIG_FILE, "r+");
	char readBuffer[65536];
	
	rapidjson::FileReadStream is(fp, readBuffer, sizeof(readBuffer));
	data.ParseStream(is);
	fclose(fp);
	data[key].SetString(value, data.GetAllocator());
	fp = fopen(CONFIG_FILE, "w"); // non-Windows use "w"
 
	char writeBuffer[65536];
	rapidjson::FileWriteStream os(fp, writeBuffer, sizeof(writeBuffer));
 
	rapidjson::PrettyWriter<rapidjson::FileWriteStream> writer(os);
	data.Accept(writer);
 
	fclose(fp);
	return 0;
 	
}
/**
* @brief Clear the config file to the default contents
*
* @return 
*/
int AWSIoTCore::ClearConfig()
{
	this->UpdateConfigFile("groupArn", "");
    	this->UpdateConfigFile("groupName", "");
    	this->UpdateConfigFile("certificatePath", "");
    	this->UpdateConfigFile("privateKeyPath", "");
    	this->UpdateConfigFile("certificateArn","");
    	this->UpdateConfigFile("endpoint", "");
    	this->UpdateConfigFile("rootCACertificatePath", "");
    	this->UpdateConfigFile("thingName", "");

	rapidjson::Document data;
        std::ofstream outfile;
        FILE* fp = fopen(CONFIG_FILE, "r+");
        char readBuffer[65536];

        rapidjson::FileReadStream is(fp, readBuffer, sizeof(readBuffer));
        data.ParseStream(is);
        fclose(fp);
	data["endDevices"].Erase(data["endDevices"].Begin(), data["endDevices"].End());

        fp = fopen(CONFIG_FILE, "w"); // non-Windows use "w"
        char writeBuffer[65536];
        rapidjson::FileWriteStream os(fp, writeBuffer, sizeof(writeBuffer));
	
	rapidjson::PrettyWriter<rapidjson::FileWriteStream> writer(os);
        data.Accept(writer);

        fclose(fp);

	return 0;
}
/**
* @brief Parse the create gateway API response and update the config
*
* @param payload - to be parsed
*
* @return 
*/
int AWSIoTCore::ParseCreateGatewayResponse(std::string payload)
{
	rapidjson::Document data;
	data.Parse(payload.c_str());
	LOG_INFO("Loaded JSON");
	this->UpdateConfigFile("thingName", data["thing"]["thingName"].GetString());
	//this->UpdateConfigFile("certificateArn", data["certificates"]["certificateArn"].GetString());
	this->UpdateConfigFile("groupArn", data["group"]["thingGroupArn"].GetString());
	this->UpdateConfigFile("groupName", data["group"]["thingGroupName"].GetString());
	this->UpdateConfigFile("endpoint", data["endpoint"]["endpointAddress"].GetString());

	struct stat info;
	if( stat( PATH_TO_CERTS, &info ) != 0 ) {
		LOG_INFO( "cannot access %s", PATH_TO_CERTS );
		LOG_INFO("creating directory...");
		int r = mkdir(PATH_TO_CERTS, 0775);
		if(!r) {
			LOG_INFO("Directory created successfully!");
		}
		else {
			LOG_ERROR("Unable to create directory");
		}
	}
	else if( info.st_mode & S_IFDIR )  // S_ISDIR() doesn't exist on my windows 
		LOG_INFO( "%s directory exists", PATH_TO_CERTS );
	else
		LOG_INFO( "%s is not a directory", PATH_TO_CERTS );
			

	auto certificateId = data["certificates"]["certificateId"].GetString();
	auto certificateArn = data["certificates"]["certificateArn"].GetString();
	auto certificatePem = data["certificates"]["certificatePem"].GetString();
	auto publicKey = data["certificates"]["keyPair"]["PublicKey"].GetString();
	auto privateKey = data["certificates"]["keyPair"]["PrivateKey"].GetString();
	LOG_INFO("Certificate Arn: %s", certificateArn);
	std::string fileName;
	LOG_INFO("Writing certificates to file.....");
	fileName = std::string(PATH_TO_CERTS).c_str() + std::string(certificateId).substr(0,10) + std::string("-certificate") + std::string(".pem.crt");
	this->WriteToFile(fileName.c_str(), certificatePem);
	this->UpdateConfigFile("certificatePath", fileName.c_str());
	fileName = std::string(PATH_TO_CERTS).c_str() + std::string(certificateId).substr(0,10) + std::string("-private") + std::string(".pem.key");
	this->WriteToFile(fileName.c_str(), privateKey);
	this->UpdateConfigFile("privateKeyPath", fileName.c_str());
	fileName = std::string(PATH_TO_CERTS).c_str() + std::string(certificateId).substr(0,10) + std::string("-public") + std::string(".pem.key");
	this->WriteToFile(fileName.c_str(), privateKey);
	this->UpdateConfigFile("certificateArn", certificateArn);

	LOG_INFO("Getting Amazon Root CA cartificate.....");
	auto rootca = this->GetAmazonRootCACertificate();
	
	fileName = std::string(PATH_TO_CERTS).c_str() + std::string("AmazonRootCA1.pem");
	this->WriteToFile(fileName.c_str(), rootca.c_str());
	this->UpdateConfigFile("rootCACertificatePath", fileName.c_str());

	LOG_INFO("Written to file");

	//this->UpdateConfigFile();
	return 0;
}
/**
* @brief Parse the response and update the config file
*
* @param payload - to be parsed
*
* @return 
*/
int AWSIoTCore::ParseCreateSensorResponse(std::string payload)
{
	rapidjson::Document d;
	d.Parse(payload.c_str());

	//document.Parse(attributes); // JSON Attributes
        rapidjson::Document data;
        //rapidjson::Document deviceInfo;
        //deviceInfo.Parse(attributes);
        std::ofstream outfile;
        FILE* fp = fopen(CONFIG_FILE, "r+");
        char readBuffer[65536];

        rapidjson::FileReadStream is(fp, readBuffer, sizeof(readBuffer));
        data.ParseStream(is);
        fclose(fp);
        //
        //data[key].SetString(value, data.GetAllocator());

        //rapidjson::Value& v = deviceInfo;
        for (rapidjson::SizeType i = 0; i < d["thing"].Size(); i++) {

            // work with parameterB[i]["status"], parameterB[i]["B_1"], etc.
        	rapidjson::Value device(rapidjson::kObjectType);
        	device.AddMember("deviceName", d["thing"][i]["thingName"], data.GetAllocator());
        	device.AddMember("deviceMacAddress", d["thing"][i]["macAddress"], data.GetAllocator());
        	device.AddMember("thingId", d["thing"][i]["thingId"], data.GetAllocator());
        	device.AddMember("thingArn", d["thing"][i]["thingArn"], data.GetAllocator());
        	//device.AddMember("displayDeviceType", deviceInfo["displayDeviceType"], data.GetAllocator());
        	//device.AddMember("deviceHid", deviceInfo["eui64"], data.GetAllocator());
        	//device.AddMember("deviceName", v["name"], data.GetAllocator());
        	data["endDevices"].PushBack(device, data.GetAllocator());
        }
        //LOG_INFO("Value: %s", document[0]["deviceName"].GetString());
        //device.AddMember("name", "abhijit", document.GetAllocator());
        //data["endDevices"].PushBack(device, document.GetAllocator());

        //
        fp = fopen(CONFIG_FILE, "w"); // non-Windows use "w"
	char writeBuffer[65536];
        rapidjson::FileWriteStream os(fp, writeBuffer, sizeof(writeBuffer));

        rapidjson::PrettyWriter<rapidjson::FileWriteStream> writer(os);
        data.Accept(writer);

        fclose(fp);
        return 0;
	
}

/**
* @brief Call back function to hold the curl response
*
* @param contents
* @param size
* @param nmemb
* @param userp
*
* @return 
*/
size_t AWSIoTCore::WriteCallback(void *contents, size_t size, size_t nmemb, void *userp)
{
            ((std::string*)userp)->append((char*)contents, size * nmemb);
                return size * nmemb;
}

/**
* @brief Call the Create Thing API on AWS
*
* @param body - to be passed in the API body
*
* @return the string response
*/
std::string AWSIoTCore::CallCreateThingAPI(const char * body) {

	LOG_INFO("Calling create things API with body: %s", body);
	CURL *curl;
	CURLcode res;
	struct curl_slist *headers = NULL;
	std::string readBuffer;

	curl = curl_easy_init();
	if(curl) {
		curl_easy_setopt(curl, CURLOPT_URL, CREATE_THING_ENDPOINT);
		curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
		curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);
		headers = curl_slist_append(headers, "Content-Type: application/json");
		headers = curl_slist_append(headers, "Accept: application/json");
		//curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "{\"name\" : \"abhijit\"}");
		curl_easy_setopt(curl, CURLOPT_POSTFIELDS, body);
	#ifdef SKIP_PEER_VERIFICATION
		/*
		 * If you want to connect to a site who isn't using a certificate that is
		 * signed by one of the certs in the CA bundle you have, you can skip the
		 * verification of the server's certificate. This makes the connection
		 * A LOT LESS SECURE.
		 *
		 * If you have a CA cert for the server stored someplace else than in the
		 * default bundle, then the CURLOPT_CAPATH option might come handy for
		 * you.
		 */
		curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 0L);
	#endif

	#ifdef SKIP_HOSTNAME_VERIFICATION
		/*
		 * If the site you're connecting to uses a different host name that what
		 * they have mentioned in their server certificate's commonName (or
		 * subjectAltName) fields, libcurl will refuse to connect. You can skip
		 * this check, but this will make the connection less secure.
		 */
		curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 0L);
	#endif
		/* Perform the request, res will get the return code */
		res = curl_easy_perform(curl);
		//printf("Response Code: %d", res);
		/* Check for errors */
		if(res != CURLE_OK)
			fprintf(stderr, "curl_easy_perform() failed: %s\n",
					curl_easy_strerror(res));

		//std::cout << readBuffer << std::endl;

		/* always cleanup */
		curl_easy_cleanup(curl);
	}

        //std::string response = "OK";
        return readBuffer;
}
/**
* @brief Get the Amazon root CA certificate by curl
*
* @return the certificate string
*/
std::string AWSIoTCore::GetAmazonRootCACertificate()
{
        CURL *curl;
        CURLcode res;
        struct curl_slist *headers = NULL;
        std::string readBuffer;

        curl = curl_easy_init();
        if(curl) {
                curl_easy_setopt(curl, CURLOPT_URL, AMAZON_ROOT_CA_ENDPOINT);
                curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
                curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);
        #ifdef SKIP_PEER_VERIFICATION
                /*
                 * If you want to connect to a site who isn't using a certificate that is
                 * signed by one of the certs in the CA bundle you have, you can skip the
                 * verification of the server's certificate. This makes the connection
                 * A LOT LESS SECURE.
                 *
                 * If you have a CA cert for the server stored someplace else than in the
                 * default bundle, then the CURLOPT_CAPATH option might come handy for
                 * you.
                 */
                curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 0L);
        #endif
	
	#ifdef SKIP_HOSTNAME_VERIFICATION
                /*
                 * If the site you're connecting to uses a different host name that what
                 * they have mentioned in their server certificate's commonName (or
                 * subjectAltName) fields, libcurl will refuse to connect. You can skip
                 * this check, but this will make the connection less secure.
                 */
                curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 0L);
        #endif
                /* Perform the request, res will get the return code */
                res = curl_easy_perform(curl);
                //printf("Response Code: %d", res);
                /* Check for errors */
                if(res != CURLE_OK)
                        fprintf(stderr, "curl_easy_perform() failed: %s\n",
                                        curl_easy_strerror(res));

                //std::cout << readBuffer << std::endl;

                /* always cleanup */
                curl_easy_cleanup(curl);
        }
	return readBuffer;
}
/**
* @brief Stringify's the JSON object.
*
* @param o - RapidJson object
*
* @return std::string for the JSON Object
*/
std::string AWSIoTCore::stringify(rapidjson::GenericValue<rapidjson::UTF8<>> & o)
{
	rapidjson::StringBuffer sb;
	rapidjson::Writer<rapidjson::StringBuffer> writer(sb);
	o.Accept(writer);
	return sb.GetString();
}
/**
* @brief Save the contents to a file.
*
* @param fileName - name of the file to be created
* @param data - char * of the data.
*
* @return 
*/
int AWSIoTCore::WriteToFile(const char * fileName, const char * data)
{
	//LOG_INFO("File name: %s", fileName);
	//LOG_INFO("Data: %s", data);
	std::ofstream outfile;
	outfile.open(fileName);
	outfile << data ;
	outfile.close();
	return 0;
}
/**
* @brief Constructor for the AWSIoTCore class.
*
* @param config - Client configuration containing necessary details about AWS.
*/
AWSIoTCore::AWSIoTCore()
{
	//Aws::SDKOptions options;
        //options.loggingOptions.logLevel = Aws::Utils::Logging::LogLevel::Debug;
        //Aws::InitAPI(options);
	//client = new Aws::IoT::IoTClient(config);

	// Initialize global curl init	
	curl_global_init(CURL_GLOBAL_DEFAULT);
	//Aws::Client::ClientConfiguration config;
        //config.region = Aws::Region::US_EAST_2;
	//client(config);
}
AWSIoTCore::~AWSIoTCore()
{
	// Curl global cleanup 	
	curl_global_cleanup();

	//Aws::ShutdownAPI(options);
}
