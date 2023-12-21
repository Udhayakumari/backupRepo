/*
 * SPDX-License-Identifier: Apache-2.0
 */

export const fabric = {
	const: {
		NETWORK_CONFIGS: 'network-configs',
		PERSISTENCE: 'persistence',
		BLOCK_TYPE_CONFIG: 'CONFIG',
		BLOCK_TYPE_ENDORSER_TRANSACTION: 'ENDORSER_TRANSACTION',
		CHAINCODE_LSCC: 'lscc',
		CHAINCODE_LIFECYCLE: '_lifecycle',
		NOTITY_TYPE_NEWCHANNEL: '1',
		NOTITY_TYPE_UPDATECHANNEL: '2',
		NOTITY_TYPE_CHAINCODE: '3',
		NOTITY_TYPE_BLOCK: '4',
		NOTITY_TYPE_EXISTCHANNEL: '5',
		NOTITY_TYPE_CLIENTERROR: '6'
	}
};

//Anusha
//Purge Changes
// Saundarya Start
export enum PurgeModes {
	TIME = "TIME",
	BLOCKCOUNT = "BLOCKCOUNT",
	NONE = "NONE"
}
// Saundarya Ends