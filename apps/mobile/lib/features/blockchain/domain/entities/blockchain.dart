import 'package:equatable/equatable.dart';

class BlockchainTransaction extends Equatable {
  const BlockchainTransaction({
    required this.id,
    required this.txHash,
    required this.status,
    this.blockNumber,
    this.fromAddress,
    this.toAddress,
    this.value = 0,
    this.gasUsed,
    this.gasPrice,
    this.network,
    this.timestamp,
    this.confirmations = 0,
    this.createdAt,
  });

  final String id;
  final String txHash;
  final String status;
  final int? blockNumber;
  final String? fromAddress;
  final String? toAddress;
  final double value;
  final double? gasUsed;
  final double? gasPrice;
  final String? network;
  final DateTime? timestamp;
  final int confirmations;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, txHash, status, blockNumber, fromAddress, toAddress,
        value, gasUsed, gasPrice, network, timestamp, confirmations, createdAt,
      ];
}

class BlockchainContract extends Equatable {
  const BlockchainContract({
    required this.id,
    required this.name,
    required this.address,
    required this.network,
    this.status = 'DEPLOYED',
    this.abi,
    this.bytecode,
    this.owner,
    this.deployTxHash,
    this.deployedAt,
    this.createdAt,
  });

  final String id;
  final String name;
  final String address;
  final String network;
  final String status;
  final String? abi;
  final String? bytecode;
  final String? owner;
  final String? deployTxHash;
  final DateTime? deployedAt;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, address, network, status, abi, bytecode,
        owner, deployTxHash, deployedAt, createdAt,
      ];
}

class BlockchainAuditEntry extends Equatable {
  const BlockchainAuditEntry({
    required this.id,
    required this.eventType,
    required this.txHash,
    this.blockNumber,
    this.contractAddress,
    this.fromAddress,
    this.payload,
    this.status = 'CONFIRMED',
    this.timestamp,
    this.createdAt,
  });

  final String id;
  final String eventType;
  final String txHash;
  final int? blockNumber;
  final String? contractAddress;
  final String? fromAddress;
  final String? payload;
  final String status;
  final DateTime? timestamp;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, eventType, txHash, blockNumber, contractAddress,
        fromAddress, payload, status, timestamp, createdAt,
      ];
}

class BlockchainNetworkHealth extends Equatable {
  const BlockchainNetworkHealth({
    required this.id,
    required this.network,
    required this.status,
    this.blockHeight = 0,
    this.peerCount = 0,
    this.syncProgress,
    this.latencyMs,
    this.lastBlockAt,
    this.checkedAt,
  });

  final String id;
  final String network;
  final String status;
  final int blockHeight;
  final int peerCount;
  final double? syncProgress;
  final double? latencyMs;
  final DateTime? lastBlockAt;
  final DateTime? checkedAt;

  @override
  List<Object?> get props => <Object?>[
        id, network, status, blockHeight, peerCount,
        syncProgress, latencyMs, lastBlockAt, checkedAt,
      ];
}
