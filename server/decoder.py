import json

def decode_hex_payload(hex_string):
    """Decode hex string to bytes and then to ASCII"""
    try:
        data = bytes.fromhex(hex_string)
        return data.decode('ascii', errors='replace')
    except Exception as e:
        return f"Error decoding: {e}"

def is_regular_packet(decoded_payload):
    """Determine if a packet is a regular/heartbeat message"""
    # Regular patterns: ACK (0x06), heartbeat messages, or very short payloads
    if len(decoded_payload.strip()) <= 1:
        return True
    # Heartbeat patterns often contain just spaces and special chars
    if decoded_payload.strip().replace('@', '').replace(' ', '').isdigit():
        return True
    return False

def main():
    # Read the JSON file
    json_file_path = "../Zap6800_Logs/SIA/tcp_packets_20251216_152501.json"
    output_file_path = "../Zap6800_Logs/SIA/decoded_payloads.txt"
    filtered_output_path = "../Zap6800_Logs/SIA/non_regular_packets.txt"

    try:
        with open(json_file_path, 'r') as f:
            data = json.load(f)

        non_empty_responses = []
        non_regular_packets = []

        # Open output file for writing
        with open(output_file_path, 'w') as output:
            output.write("=== TCP Packet Payload Decoder ===\n")
            output.write(f"Total packets: {data['capture_info']['total_packets']}\n")
            output.write(f"Target: {data['capture_info']['target_ip']}:{data['capture_info']['target_port']}\n")
            output.write(f"Timestamp: {data['capture_info']['timestamp']}\n")
            output.write("=" * 60 + "\n")

            # Process each packet
            for packet in data['packets']:
                packet_num = packet['packet_number']
                payload_length = packet['payload_length']
                payload_hex = packet['payload']
                timestamp = packet['timestamp']
                src_ip = packet['src_ip']
                dest_ip = packet['dest_ip']

                # Only decode packets with payloads
                if payload_length > 0:
                    decoded_payload = decode_hex_payload(payload_hex)

                    output.write(f"\nPacket #{packet_num}\n")
                    output.write(f"Time: {timestamp}\n")
                    output.write(f"From: {src_ip} -> To: {dest_ip}\n")
                    output.write(f"Payload Length: {payload_length} bytes\n")
                    output.write(f"Hex: {payload_hex}\n")
                    output.write(f"Decoded: '{decoded_payload}'\n")
                    output.write("-" * 40 + "\n")

                    # Collect non-empty responses
                    non_empty_responses.append({
                        'packet_num': packet_num,
                        'timestamp': timestamp,
                        'src_ip': src_ip,
                        'dest_ip': dest_ip,
                        'hex': payload_hex,
                        'decoded': decoded_payload
                    })

                    # Collect non-regular packets
                    if not is_regular_packet(decoded_payload):
                        non_regular_packets.append({
                            'packet_num': packet_num,
                            'timestamp': timestamp,
                            'src_ip': src_ip,
                            'dest_ip': dest_ip,
                            'hex': payload_hex,
                            'decoded': decoded_payload
                        })

        # Write filtered non-regular packets to separate file
        with open(filtered_output_path, 'w') as filtered_output:
            filtered_output.write("=== NON-REGULAR PACKETS (Security Events) ===\n")
            filtered_output.write(f"Total non-regular packets: {len(non_regular_packets)}\n")
            filtered_output.write("=" * 60 + "\n")

            for pkt in non_regular_packets:
                filtered_output.write(f"\nPacket #{pkt['packet_num']}\n")
                filtered_output.write(f"Time: {pkt['timestamp']}\n")
                filtered_output.write(f"From: {pkt['src_ip']} -> To: {pkt['dest_ip']}\n")
                filtered_output.write(f"Hex: {pkt['hex']}\n")
                filtered_output.write(f"Decoded: '{pkt['decoded']}'\n")
                filtered_output.write("-" * 40 + "\n")

        # Print summary to console
        print("=" * 60)
        print("ALL NON-EMPTY RESPONSES:")
        print("=" * 60)
        for pkt in non_empty_responses:
            print(f"Packet #{pkt['packet_num']}: '{pkt['decoded']}'")

        print("\n" + "=" * 60)
        print("NON-REGULAR PACKETS (Security Events):")
        print("=" * 60)
        for pkt in non_regular_packets:
            print(f"\nPacket #{pkt['packet_num']}")
            print(f"Time: {pkt['timestamp']}")
            print(f"From: {pkt['src_ip']} -> To: {pkt['dest_ip']}")
            print(f"Decoded: '{pkt['decoded']}'")

        print(f"\n✓ All payloads saved to: {output_file_path}")
        print(f"✓ Non-regular packets saved to: {filtered_output_path}")
        print(f"  Total packets: {data['capture_info']['total_packets']}")
        print(f"  Non-empty responses: {len(non_empty_responses)}")
        print(f"  Non-regular packets: {len(non_regular_packets)}")

    except FileNotFoundError:
        print(f"Error: JSON file not found at {json_file_path}")
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    main()
