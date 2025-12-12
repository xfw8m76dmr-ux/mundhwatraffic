My camera routine health check and troubleshoot sequence. To be automated.

1. I go on website and check if video stream is workinf or not
2. If not i go on youtube studio and check if the youtube is receiving data stream from my host computer runnning stream or not
3. If youtube is receiving stream then , update youtube setting”allow embedding “ to Yes — issue resolved — Stop 
4. If youtube is not receiving stream then , i log into my streaming computer and check the ping to camera at 102.168.0.101 (preferred stable IP) , if it does not work the I ping 192.168.0.11 ( the camera sometimes switches the IP for unknow reason)
   cd /opt/mundhwa , cat run_stream.py | grep "rtspsrc"
6. If IP is switched by camera the update the rtsp source url to 192.168.0.11 
7. restart the livestream system service -- see command in concrete file in VScode mac
8. Check if youtube is receiving data stream or not. If itis then set video visibility to Public and “allow embedding”
9. If restarting service does not bring the connection after a minute then, manually restart camera and do step 5,6,7 again
10. do sudo reboot if it helps
11. if camera goes down the notification sending pipeline can break, restart that service /opt/mundhwa_screenie notify_if_traffic.py there is a file in VScode rhat has command to restart this service . can also do sudo reboot to start this service. 
