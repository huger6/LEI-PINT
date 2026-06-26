class RewardModel {
  final int id;
  final String rewardGuid;
  final String rewardName;
  final String? rewardDescription;
  final int costPoints;
  final String? rewardCategory;
  final String? imgUrl;

  RewardModel({
    required this.id,
    required this.rewardGuid,
    required this.rewardName,
    this.rewardDescription,
    this.costPoints = 0,
    this.rewardCategory,
    this.imgUrl,
  });

  factory RewardModel.fromJson(Map<String, dynamic> json) {
    return RewardModel(
      id: _toInt(json['id'] ?? json['reward_id'] ?? 0),
      rewardGuid: (json['rewardGuid'] ?? json['reward_guid'] ?? '').toString(),
      rewardName: (json['name'] ?? json['rewardName'] ?? json['reward_name'] ?? '').toString(),
      rewardDescription: json['description']?.toString() ??
          json['rewardDescription']?.toString() ??
          json['reward_description']?.toString(),
      costPoints: _toInt(json['costPoints'] ?? json['cost_points'] ?? 0),
      rewardCategory: json['category']?.toString() ??
          json['rewardCategory']?.toString() ??
          json['reward_category']?.toString(),
      imgUrl: json['imgUrl']?.toString() ?? json['img_url']?.toString(),
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }
}
