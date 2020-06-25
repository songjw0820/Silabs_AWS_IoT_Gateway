#include "aws-iot-device-class.hpp"


AWSIoTDevice::AWSIoTDevice()
{
	LOG_INFO("Constructor called");

	if(AWS_SDK_DEBUG)
	{
		std::shared_ptr<awsiotsdk::util::Logging::ConsoleLogSystem> p_log_system =
        	        std::make_shared<awsiotsdk::util::Logging::ConsoleLogSystem>(awsiotsdk::util::Logging::LogLevel::Debug);
	        awsiotsdk::util::Logging::InitializeAWSLogging(p_log_system);
	}

	awsiotsdk::ResponseCode configResponse = awsiotsdk::ConfigCommon::InitializeCommon(CONFIG_FILE);
        if (awsiotsdk::ResponseCode::SUCCESS == configResponse) {
                LOG_INFO("Config file loaded successfully");
        }
	else
	{
        	LOG_ERROR("Error Response: %s", awsiotsdk::ResponseHelper::ToString(configResponse).c_str());
	}
	LOG_INFO("root_ca_path: %s",awsiotsdk::ConfigCommon::root_ca_path_.c_str());
	p_network_connection =
                std::make_shared<awsiotsdk::network::OpenSSLConnection>(awsiotsdk::ConfigCommon::endpoint_,
                                                             awsiotsdk::ConfigCommon::endpoint_mqtt_port_,
                                                             awsiotsdk::ConfigCommon::root_ca_path_,
                                                             awsiotsdk::ConfigCommon::client_cert_path_,
                                                             awsiotsdk::ConfigCommon::client_key_path_,
                                                             awsiotsdk::ConfigCommon::tls_handshake_timeout_,
                                                             awsiotsdk::ConfigCommon::tls_read_timeout_,
                                                             awsiotsdk::ConfigCommon::tls_write_timeout_, true);
	awsiotsdk::ResponseCode rc = p_network_connection->Initialize();
        if(awsiotsdk::ResponseCode::SUCCESS == rc) {
                LOG_INFO("Network Connection Initialized");
        }
	
	p_iot_client_ = awsiotsdk::MqttClient::Create(p_network_connection, awsiotsdk::ConfigCommon::mqtt_command_timeout_);

	LOG_INFO("Trying MQTT Connect");
        rc = p_iot_client_->Connect(std::chrono::milliseconds(30000), false, awsiotsdk::mqtt::Version::MQTT_3_1_1, std::chrono::seconds(60), awsiotsdk::Utf8String::Create("abhijitclient1"), nullptr, nullptr, nullptr);

        LOG_INFO("Response: %s", awsiotsdk::ResponseHelper::ToString(rc).c_str());
        if(awsiotsdk::ResponseCode::MQTT_CONNACK_CONNECTION_ACCEPTED == rc) {
                LOG_INFO("MQTT Connection established!");
        }
	
}

int AWSIoTDevice::Publish(const char * topic, const char * payload)
{
	awsiotsdk::util::String p_pub_topic_name_str = topic;
        std::unique_ptr<awsiotsdk::Utf8String> p_pub_topic_name = awsiotsdk::Utf8String::Create(p_pub_topic_name_str);
        awsiotsdk::util::String payloadData = payload;
        awsiotsdk::ResponseCode rc = p_iot_client_->Publish(std::move(p_pub_topic_name), false, false, awsiotsdk::mqtt::QoS::QOS1, payloadData, std::chrono::milliseconds(30000));
	if(rc == awsiotsdk::ResponseCode::SUCCESS)
	{
		LOG_INFO("Message successfully published on topic: %s", topic);
		return 0;
	}
	return -1;
}

/**
* @brief Destructor for the AWSIoTDevice class.
*/
AWSIoTDevice::~AWSIoTDevice()
{
	if(AWS_SDK_DEBUG)
		awsiotsdk::util::Logging::ShutdownAWSLogging();
}
