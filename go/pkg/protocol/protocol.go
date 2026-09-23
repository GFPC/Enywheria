package protocol

import (
	"encoding/json"
)

type Packet struct {
	Type    string                 `json:"type"`
	Sender  string                 `json:"sender"`
	Target  string                 `json:"target,omitempty"`
	Token   string                 `json:"token"`
	Payload map[string]interface{} `json:"payload,omitempty"`
}

func CreatePacket(msgType, sender, target, token string, payload map[string]interface{}) ([]byte, error) {
	pkt := Packet{
		Type:    msgType,
		Sender:  sender,
		Target:  target,
		Token:   token,
		Payload: payload,
	}
	return json.Marshal(pkt)
}

func ParsePacket(data []byte) (*Packet, error) {
	var pkt Packet
	err := json.Unmarshal(data, &pkt)
	if err != nil {
		return nil, err
	}
	return &pkt, nil
}
