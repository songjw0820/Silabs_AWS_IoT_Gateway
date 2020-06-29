SUMMARY = "Simple Hello World Cmake application"
SECTION = "examples"
LICENSE = "CLOSED"

inherit systemd
inherit cmake

SRC_URI = "\
        file://include/discovery/Discovery.hpp \
	file://include/discovery/DiscoveryResponse.hpp \
	file://include/NetworkConnection.hpp \
	file://include/jobs/Jobs.hpp \
	file://include/ClientCore.hpp \
	file://include/macrologger.h \
	file://include/aws-iot-core-class.hpp \
	file://include/ResponseCode.hpp \
	file://include/mqtt/Packet.hpp \
	file://include/mqtt/GreengrassMqttClient.hpp \
	file://include/mqtt/ClientState.hpp \
	file://include/mqtt/Subscribe.hpp \
	file://include/mqtt/NetworkRead.hpp \
	file://include/mqtt/Publish.hpp \ 
	file://include/mqtt/Client.hpp \
	file://include/mqtt/Common.hpp \
	file://include/mqtt/Connect.hpp \
	file://include/ClientCoreState.hpp \
	file://include/shadow/Shadow.hpp \
	file://include/mqtt-handlers.h \
	file://include/util/JsonParser.hpp \
	file://include/util/Utf8String.hpp \
	file://include/util/threading \
	file://include/util/threading/ThreadTask.hpp \
	file://include/util/memory/stl/StringStream.hpp \
	file://include/util/memory/stl/Queue.hpp \
	file://include/util/memory/stl/Map.hpp \
	file://include/util/memory/stl/Vector.hpp \
	file://include/util/memory/stl/String.hpp \
	file://include/util/Core_EXPORTS.hpp \
	file://include/util/logging/FormattedLogSystem.hpp \
	file://include/util/logging/Logging.hpp \
	file://include/util/logging/LogLevel.hpp \
	file://include/util/logging/LogSystemInterface.hpp \
	file://include/util/logging/ConsoleLogSystem.hpp \
	file://include/util/logging/LogMacros.hpp \
	file://include/Action.hpp \
	file://include/aws-iot-device-class.hpp \
	file://CMakeLists-rapidjson.txt.in \
	file://src/aws-iot-core-class.cpp \
	file://src/main.cpp \
	file://src/common/SwitchConfig.json \
	file://src/common/RobotArmConfig.json \
	file://src/common/ConfigCommon.cpp \
	file://src/common/SampleConfig.json \
	file://src/common/ConfigCommon.hpp \
	file://src/mqtt/Common.cpp \
	file://src/mqtt/NetworkRead.cpp \
	file://src/mqtt/Publish.cpp \
	file://src/mqtt/Subscribe.cpp \
	file://src/mqtt/GreengrassMqttClient.cpp \
	file://src/mqtt/Connect.cpp \
	file://src/mqtt/Client.cpp \
	file://src/mqtt/Packet.cpp \
	file://src/mqtt/ClientState.cpp \
	file://src/network/CMakeLists.txt.in \
	file://src/network/CMakeLists-mbedtls.txt.in \
	file://src/network/WebSocket/wslay/wslay.hpp \
	file://src/network/WebSocket/wslay/wslay_net.hpp \
	file://src/network/WebSocket/wslay/wslay_net.cpp \
	file://src/network/WebSocket/wslay/wslay_frame.hpp \
	file://src/network/WebSocket/wslay/wslay_frame.cpp \
	file://src/network/WebSocket/WebSocketConnection.cpp \
	file://src/network/WebSocket/WebSocketConnection.hpp \
	file://src/network/MbedTLS/MbedTLSConnection.cpp \
	file://src/network/MbedTLS/MbedTLSConnection.hpp \
	file://src/network/OpenSSL/OpenSSLConnection.hpp \
	file://src/network/OpenSSL/OpenSSLConnection.cpp \
	file://src/network/README.md \
	file://src/aws-iot-device-class.cpp \
	file://CMakeLists.txt \
	file://awsapp.service \
	file://config.json \
	"

do_install_append() {
        install -d ${D}/opt/awsapp/
        install -m 0755 ${S}/config.json ${D}/opt/awsapp/

        install -d ${D}${sysconfdir}/systemd/system
        install -m 0644 ${S}/awsapp.service ${D}${sysconfdir}/systemd/system/
}

FILES_${PN} += "/opt/awsapp /usr/bin/"

SYSTEMD_PACKAGES = "${PN}"
SYSTEMD_SERVICE_${PN} = "awsapp.service"
SYSTEMD_AUTO_ENABLE = "enable"

DEPENDS += " mosquitto curl aws-iot-device-sdk-cpp "
RDEPENDS_${PN} = "aws-iot-device-sdk-cpp"

S = "${WORKDIR}"

EXTRA_OECMAKE = ""
