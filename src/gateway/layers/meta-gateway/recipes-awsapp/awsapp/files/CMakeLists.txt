#mal CMakeLists.txt for the AWS SDK for C++
cmake_minimum_required(VERSION 3.5)
# "my-example" is just an example value.
project(awscpp)

set(APP_NAME awsapp)

set(CMAKE_CXX_STANDARD 11)

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} ${CMAKE_CURRENT_SOURCE_DIR}/cmake)


configure_file(CMakeLists-rapidjson.txt.in ${CMAKE_BINARY_DIR}/${DEPENDENCY_DIR}/rapidjson/download/CMakeLists.txt)
execute_process(COMMAND ${CMAKE_COMMAND} -G "${CMAKE_GENERATOR}" .
    WORKING_DIRECTORY ${CMAKE_BINARY_DIR}/${DEPENDENCY_DIR}/rapidjson/download)
execute_process(COMMAND ${CMAKE_COMMAND} --build .
   WORKING_DIRECTORY ${CMAKE_BINARY_DIR}/${DEPENDENCY_DIR}/rapidjson/download)


# Add Target
add_executable(${APP_NAME} "${PROJECT_SOURCE_DIR}/src/main.cpp;${PROJECT_SOURCE_DIR}/src/aws-iot-core-class.cpp;${PROJECT_SOURCE_DIR}/src/aws-iot-device-class.cpp;${PROJECT_SOURCE_DIR}/src/common/ConfigCommon.cpp")

message("PROJECT_SOURCE_DIRECOTORY: ${PROJECT_SOURCE_DIR}")
target_include_directories(${APP_NAME} PUBLIC ${PROJECT_SOURCE_DIR}/include)
target_include_directories(${APP_NAME} PUBLIC ${PROJECT_SOURCE_DIR}/src)
target_include_directories(${APP_NAME} PUBLIC ${RAPIDJSON_INCLUDE_DIR})

target_include_directories(${APP_NAME} PUBLIC ${CMAKE_BINARY_DIR}/${DEPENDENCY_DIR}/rapidjson/src/include)


# Locate the AWS SDK for C++ package.
# Requires that you build with:
# -DCMAKE_PREFIX_PATH=/path/to/sdk_install
#find_package(AWSSDK)

# Configure Threading library
find_package(Threads REQUIRED)

#find_package(aws-sdk-cpp)
# The executable name and its sourcefiles

#set(AWS_IOT_DEVICE_SDK_CPP_LIB ${BUILD_PATH_OE}/tmp-rpb-glibc/work/aarch64-linaro-linux/aws-iot-device-sdk-cpp/1.3.0-r0/build/lib/libaws-iot-sdk-cpp.so)
#set(AWS_IOT_DEVICE_SDK_CPP_LIB /home/abhijit/aws-iot/aws-iot-device-sdk-cpp/build/archive/libaws-iot-sdk-cpp.a)
#add_executable(my-example main.cpp aws-iot-core-class.cpp)
# The libraries used by your executable.
# "aws-cpp-sdk-s3" is just an example.
#message("LINK_LIBRARIES: ${AWSSDK_LINK_LIBRARIES}")
#target_link_libraries(${APP_NAME} aws-cpp-sdk-iot aws-cpp-sdk-core mosquitto ${AWS_IOT_DEVICE_SDK_CPP_LIB} curl)
target_link_libraries(${APP_NAME} aws-iot-sdk-cpp mosquitto curl)
#target_link_libraries(${APP_NAME} ${AWS_IOT_DEVICE_SDK_CPP_LIB} mosquitto curl)
target_link_libraries(${APP_NAME} "Threads::Threads")

set(NETWORK_WRAPPER_DEST_TARGET ${APP_NAME})
include(${PROJECT_SOURCE_DIR}/src/network/CMakeLists.txt.in)

install(TARGETS ${APP_NAME} RUNTIME DESTINATION bin)
