import '../../core/constants/api_endpoints.dart';
import '../../models/redemption_model.dart';
import '../../models/reward_model.dart';
import '../local/current_user_dao.dart';
import '../local/redemption_dao.dart';
import '../local/reward_dao.dart';
import '../local/title_dao.dart';
import '../remote/api_client.dart';

class RewardRepository {
  final ApiClient _apiClient;
  final RewardDao _rewardDao;
  final RedemptionDao _redemptionDao;
  final TitleDao _titleDao;
  final CurrentUserDao _currentUserDao;

  RewardRepository(
    this._apiClient,
    this._rewardDao,
    this._redemptionDao,
    this._titleDao,
    this._currentUserDao,
  );

  Future<List<RewardModel>> getRewardsLocal() => _rewardDao.getAll();

  Future<List<RedemptionModel>> getRedemptionsLocal() =>
      _redemptionDao.getAll();

  Future<List<String>> getUnlockedTitlesLocal() => _titleDao.getAll();

  Future<String?> getActiveTitleLocal() => _currentUserDao.getActiveTitle();

  Future<Map<String, dynamic>> redeemReward(String rewardGuid) async {
    final response = await _apiClient.post(
      ApiEndpoints.redeemReward(rewardGuid),
    );
    final data = response is Map<String, dynamic>
        ? (response['data'] ?? response)
        : response;
    return data is Map<String, dynamic> ? data : {};
  }

  Future<void> setActiveTitle(String? title) async {
    await _apiClient.patch(
      ApiEndpoints.setActiveTitle,
      data: {'title': title},
    );
    await _currentUserDao.updateActiveTitle(title);
  }
}
