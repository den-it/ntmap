var NTMAP_BACKEND_URI = "/data";
var NETBOX_URL = "https://netbox.yourdomain.com";

// Key: device type in Netbox, value: SVG-image in /www/img directory
// If device with some other device type is selected from Netbox to be displayed on a map, "unknown.svg" image will be chosen
// You can add your own device types and their images here
// Note: use only SVG-images with dimensions 32 x 32 pixels
var DEVICE_ROLES = {
	"Router": 						"router.svg",
	"Firewall": 						"firewall.svg",
	"IPS": 								"ips.svg",
	"Server": 						"server.svg",
	"Encryption Gateway": 	"cryptogw.svg",
	"SAN Switch": 				"sanswitch.svg",
	"Switch": 						"switch.svg",
	"Blade Switch": 				"mngswitch.svg",
	"Management Switch": 	"mngswitch.svg",
	"Switch Chassis": 			"coreswitch.svg",
	"VRSG": 						"vrsg.svg",
	"Storage System":			"storage.svg",
	"Tape Library":				"tapelibrary.svg",
	"Load Balancer": 			"loadbalancer.svg",
	"Unknown": 					"unknown.svg"
}