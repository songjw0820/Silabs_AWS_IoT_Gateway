#include "mqtt/Client.hpp"
//#include "Client.hpp"
#include "NetworkConnection.hpp"
#include "common/ConfigCommon.hpp"
#ifdef USE_WEBSOCKETS
#include "network/WebSocket/WebSocketConnection.hpp"
#elif defined USE_MBEDTLS
#include "network/MbedTLS/MbedTLSConnection.hpp"
#else
#include "network/OpenSSL/OpenSSLConnection.hpp"
#endif

#include "util/logging/Logging.hpp"
#include "util/logging/LogMacros.hpp"
#include "util/logging/ConsoleLogSystem.hpp"

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



#include <chrono>
#include <thread>
#include <mosquitto.h>
#include "macrologger.h"

#ifndef CONFIG_FILE
#define CONFIG_FILE	"/opt/awsapp/config.json"
#endif

#define AWS_SDK_DEBUG    1

class AWSIoTDevice
{
	public:
		AWSIoTDevice();
		int Publish(const char * topic, const char * payload);
		~AWSIoTDevice();
	private:
		std::shared_ptr<awsiotsdk::network::OpenSSLConnection> p_network_connection;
		std::shared_ptr<awsiotsdk::MqttClient> p_iot_client_;
		rapidjson::Document document;
};

