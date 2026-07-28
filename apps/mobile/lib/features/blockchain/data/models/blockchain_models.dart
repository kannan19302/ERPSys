import '../../../../core/error/exceptions.dart';
import '../../domain/entities/blockchain.dart';

double asDouble(Object? value) => switch (value) {
      final num v => v.toDouble(),
      final String v => double.tryParse(v) ?? 0,
      _ => 0,
    };

int asInt(Object? value) => switch (value) {
      final int v => v,
      final num v => v.toInt(),
      final String v => int.tryParse(v) ?? 0,
      _ => 0,
    };


class BlockchainTransactionModel extends BlockchainTransaction {
  const BlockchainTransactionModel({
    required super.id,
    required super.txHash,
    required super.status,
    super.blockNumber,
    super.fromAddress,
    super.toAddress,
    super.value = 0,
    super.gasUsed,
    super.gasPrice,
    super.network,
    super.timestamp,
    super.confirmations = 0,
    super.createdAt,
  });

  factory BlockchainTransactionModel.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    if (id is! String) throw const ParseException('BlockchainTransaction missing id');
    return BlockchainTransactionModel(
      id: id,
      txHash: json['txHash'] as String? ?? '',
      status: json['status'] as String? ?? 'PENDING',
      blockNumber: asInt(json['blockNumber']),
      fromAddress: json['fromAddress'] as String?,
      toAddress: json['toAddress'] as String?,
      value: asDouble(json['value']),
      gasUsed: asDouble(json['gasUsed']),
      gasPrice: asDouble(json['gasPrice']),
      network: json['network'] as String?,
      timestamp: DateTime.tryParse('${json['timestamp']}'),
      confirmations: asInt(json['confirmations']),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'txHash': txHash,
        'status': status,
        'blockNumber': blockNumber,
        'fromAddress': fromAddress,
        'toAddress': toAddress,
        'value': value,
        'gasUsed': gasUsed,
        'gasPrice': gasPrice,
        'network': network,
        'timestamp': timestamp?.toIso8601String(),
        'confirmations': confirmations,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class BlockchainContractModel extends BlockchainContract {
  const BlockchainContractModel({
    required super.id,
    required super.name,
    required super.address,
    required super.network,
    super.status = 'DEPLOYED',
    super.abi,
    super.bytecode,
    super.owner,
    super.deployTxHash,
    super.deployedAt,
    super.createdAt,
  });

  factory BlockchainContractModel.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    if (id is! String) throw const ParseException('BlockchainContract missing id');
    return BlockchainContractModel(
      id: id,
      name: json['name'] as String? ?? '',
      address: json['address'] as String? ?? '',
      network: json['network'] as String? ?? '',
      status: json['status'] as String? ?? 'DEPLOYED',
      abi: json['abi'] as String?,
      bytecode: json['bytecode'] as String?,
      owner: json['owner'] as String?,
      deployTxHash: json['deployTxHash'] as String?,
      deployedAt: DateTime.tryParse('${json['deployedAt']}'),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'address': address,
        'network': network,
        'status': status,
        'abi': abi,
        'bytecode': bytecode,
        'owner': owner,
        'deployTxHash': deployTxHash,
        'deployedAt': deployedAt?.toIso8601String(),
        'createdAt': createdAt?.toIso8601String(),
      };
}

class BlockchainAuditEntryModel extends BlockchainAuditEntry {
  const BlockchainAuditEntryModel({
    required super.id,
    required super.eventType,
    required super.txHash,
    super.blockNumber,
    super.contractAddress,
    super.fromAddress,
    super.payload,
    super.status = 'CONFIRMED',
    super.timestamp,
    super.createdAt,
  });

  factory BlockchainAuditEntryModel.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    if (id is! String) throw const ParseException('BlockchainAuditEntry missing id');
    return BlockchainAuditEntryModel(
      id: id,
      eventType: json['eventType'] as String? ?? '',
      txHash: json['txHash'] as String? ?? '',
      blockNumber: asInt(json['blockNumber']),
      contractAddress: json['contractAddress'] as String?,
      fromAddress: json['fromAddress'] as String?,
      payload: json['payload'] as String?,
      status: json['status'] as String? ?? 'CONFIRMED',
      timestamp: DateTime.tryParse('${json['timestamp']}'),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'eventType': eventType,
        'txHash': txHash,
        'blockNumber': blockNumber,
        'contractAddress': contractAddress,
        'fromAddress': fromAddress,
        'payload': payload,
        'status': status,
        'timestamp': timestamp?.toIso8601String(),
        'createdAt': createdAt?.toIso8601String(),
      };
}

class BlockchainNetworkHealthModel extends BlockchainNetworkHealth {
  const BlockchainNetworkHealthModel({
    required super.id,
    required super.network,
    required super.status,
    super.blockHeight = 0,
    super.peerCount = 0,
    super.syncProgress,
    super.latencyMs,
    super.lastBlockAt,
    super.checkedAt,
  });

  factory BlockchainNetworkHealthModel.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    if (id is! String) throw const ParseException('BlockchainNetworkHealth missing id');
    return BlockchainNetworkHealthModel(
      id: id,
      network: json['network'] as String? ?? '',
      status: json['status'] as String? ?? 'UNKNOWN',
      blockHeight: asInt(json['blockHeight']),
      peerCount: asInt(json['peerCount']),
      syncProgress: asDouble(json['syncProgress']),
      latencyMs: asDouble(json['latencyMs']),
      lastBlockAt: DateTime.tryParse('${json['lastBlockAt']}'),
      checkedAt: DateTime.tryParse('${json['checkedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'network': network,
        'status': status,
        'blockHeight': blockHeight,
        'peerCount': peerCount,
        'syncProgress': syncProgress,
        'latencyMs': latencyMs,
        'lastBlockAt': lastBlockAt?.toIso8601String(),
        'checkedAt': checkedAt?.toIso8601String(),
      };
}
