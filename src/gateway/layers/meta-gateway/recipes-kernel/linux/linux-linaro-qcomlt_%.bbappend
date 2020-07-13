FILESEXTRAPATHS_prepend := "${THISDIR}/files:"

SRC_URI += "\
            file://0001-Gateway-DB410C-Added-support-of-CYUSB3610-chip.patch \
            file://linux-kernel-aws-greengrass.cfg \
           "

KERNEL_CONFIG_FRAGMENTS_append = " ${WORKDIR}/linux-kernel-aws-greengrass.cfg "

KERNEL_MODULE_AUTOLOAD += "g_serial"

#SRC_URI += "\
#        file://0002-Gateway-DB410C-Added-support-of-CYUSB3610-chip.patch \
#        file://0003-Gateway-DB410C-Support-for-Factory-reset-gpio.patch \
#        file://0004-Gateway-DB410C-CYUSB3610-reset-pin.patch \
#        file://0005-Gateway-DB410C-Added-cyusb-MAC-address-support.patch \
#        file://0006-Gateway-DB410C-Removed-wifi-support-from-DB410C.patch \
#        file://0007-Gateway-DB410C-SDC-clocks-runtime-enable-disable.patch \
#        file://0008-Gateway-DB410C-Removed-unused-interfaces-support.patch \
#        file://0009-Watchdog-Enable-pimic-watchdog.patch \
#        "
