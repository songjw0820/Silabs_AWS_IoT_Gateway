1. Install the host dependencies.

   ```
   $ sudo apt-get install gawk wget git-core diffstat unzip texinfo gcc-multilib \
     build-essential chrpath socat cpio python python3 python3-pip python3-pexpect \
     xz-utils debianutils iputils-ping python3-git python3-jinja2 libegl1-mesa \
     libsdl1.2-dev pylint3 xterm
   ```

   https://github.com/96boards/oe-rpb-manifest

   `$ sudo apt-get install whiptail`

   

2. Clone source code

   `$ git clone https://git.einfochips.com:8080/a/efr32-gateway`

   

3. Go to the root directory and setup the environment

   `$ cd efr32-gateway`
   `$ MACHINE=dragonboard-410c DISTRO=rpb source ./setup-environment`

   

4. Build the image.

   `$ bitbake rpb-console-image`