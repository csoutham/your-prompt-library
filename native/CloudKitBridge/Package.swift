// swift-tools-version: 6.0
import PackageDescription

let package = Package(
	name: "CloudKitBridge",
	platforms: [
		.macOS(.v12),
	],
	products: [
		.executable(name: "CloudKitBridge", targets: ["CloudKitBridge"]),
	],
	targets: [
		.executableTarget(
			name: "CloudKitBridge",
			path: "Sources"
		),
	]
)
