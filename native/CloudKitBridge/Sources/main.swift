import CloudKit
import Foundation

struct RequestEnvelope: Decodable {
	let id: String
	let command: String
	let payload: [String: String]?
}

struct ResponseEnvelope: Encodable {
	let id: String
	let ok: Bool
	let result: [String: String]?
	let error: String?
}

@main
struct CloudKitBridgeApp {
	static func main() async {
		let output = FileHandle.standardOutput
		let decoder = JSONDecoder()
		let encoder = JSONEncoder()
		encoder.outputFormatting = [.withoutEscapingSlashes]

		while let line = readLine(strippingNewline: true), !line.isEmpty {
			do {
				let request = try decoder.decode(RequestEnvelope.self, from: Data(line.utf8))
				let response = try await handle(request: request)
				let data = try encoder.encode(response)
				output.write(data)
				output.write(Data([0x0A]))
			} catch {
				let fallback = ResponseEnvelope(
					id: "unknown",
					ok: false,
					result: nil,
					error: error.localizedDescription
				)
				if let data = try? encoder.encode(fallback) {
					output.write(data)
					output.write(Data([0x0A]))
				}
			}
		}
	}
}

func handle(request: RequestEnvelope) async throws -> ResponseEnvelope {
	switch request.command {
	case "health":
		return ResponseEnvelope(
			id: request.id,
			ok: true,
			result: [
				"bridge": "CloudKitBridge",
				"platform": "macOS",
			],
			error: nil
		)
	case "describeConfig":
		let containerId = request.payload?["containerId"] ?? ""
		let scope = request.payload?["databaseScope"] ?? "private"
		let zoneName = request.payload?["zoneName"] ?? "prompt-library"
		return ResponseEnvelope(
			id: request.id,
			ok: true,
			result: [
				"containerId": containerId,
				"databaseScope": scope,
				"zoneName": zoneName,
			],
			error: nil
		)
	case "accountStatus":
		let containerId = request.payload?["containerId"] ?? ""
		let status = try await fetchAccountStatus(containerId: containerId)
		return ResponseEnvelope(
			id: request.id,
			ok: true,
			result: [
				"containerId": containerId,
				"accountStatus": status,
			],
			error: nil
		)
	default:
		return ResponseEnvelope(
			id: request.id,
			ok: false,
			result: nil,
			error: "Unsupported command: \(request.command)"
		)
	}
}

func fetchAccountStatus(containerId: String) async throws -> String {
	let container = CKContainer(identifier: containerId)
	return try await withCheckedThrowingContinuation { continuation in
		container.accountStatus { status, error in
			if let error {
				continuation.resume(throwing: error)
				return
			}

			continuation.resume(returning: encode(status: status))
		}
	}
}

func encode(status: CKAccountStatus) -> String {
	switch status {
	case .available:
		return "available"
	case .couldNotDetermine:
		return "couldNotDetermine"
	case .noAccount:
		return "noAccount"
	case .restricted:
		return "restricted"
	case .temporarilyUnavailable:
		return "temporarilyUnavailable"
	@unknown default:
		return "unknown"
	}
}
