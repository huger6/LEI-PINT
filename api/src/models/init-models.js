var DataTypes = require("sequelize").DataTypes;
var _administrators = require("./administrators");
var _announc_sl = require("./announc_sl");
var _application_validation_logs = require("./application_validation_logs");
var _areas = require("./areas");
var _awarded_badges = require("./awarded_badges");
var _badge_applications = require("./badge_applications");
var _badge_requirements = require("./badge_requirements");
var _badges = require("./badges");
var _certificates = require("./certificates");
var _consultant_areas = require("./consultant_areas");
var _consultants = require("./consultants");
var _consultants_selected_skills = require("./consultants_selected_skills");
var _gdpr_policies = require("./gdpr_policies");
var _goals = require("./goals");
var _learning_paths = require("./learning_paths");
var _locations = require("./locations");
var _notification_definitions = require("./notification_definitions");
var _notification_preferences = require("./notification_preferences");
var _notifications = require("./notifications");
var _points_history = require("./points_history");
var _languages = require("./languages");
var _progression_stages = require("./progression_stages");
var _requirements_evidences = require("./requirements_evidences");
var _rewards = require("./rewards");
var _service_line_leaders = require("./service_line_leaders");
var _service_lines = require("./service_lines");
var _skills = require("./skills");
var _sl_slas = require("./sl_slas");
var _slas = require("./slas");
var _stage_codes = require("./stage_codes");
var _system_announcements = require("./system_announcements");
var _talent_managers = require("./talent_managers");
var _user_account_tokens = require("./user_account_tokens");
var _user_badges_interactions = require("./user_badges_interactions");
var _user_refresh_tokens = require("./user_refresh_tokens");
var _users = require("./users");

function initModels(sequelize) {
  var administrators = _administrators(sequelize, DataTypes);
  var announc_sl = _announc_sl(sequelize, DataTypes);
  var application_validation_logs = _application_validation_logs(sequelize, DataTypes);
  var areas = _areas(sequelize, DataTypes);
  var awarded_badges = _awarded_badges(sequelize, DataTypes);
  var badge_applications = _badge_applications(sequelize, DataTypes);
  var badge_requirements = _badge_requirements(sequelize, DataTypes);
  var badges = _badges(sequelize, DataTypes);
  var certificates = _certificates(sequelize, DataTypes);
  var consultant_areas = _consultant_areas(sequelize, DataTypes);
  var consultants = _consultants(sequelize, DataTypes);
  var consultants_selected_skills = _consultants_selected_skills(sequelize, DataTypes);
  var gdpr_policies = _gdpr_policies(sequelize, DataTypes);
  var goals = _goals(sequelize, DataTypes);
  var learning_paths = _learning_paths(sequelize, DataTypes);
  var locations = _locations(sequelize, DataTypes);
  var notification_definitions = _notification_definitions(sequelize, DataTypes);
  var notification_preferences = _notification_preferences(sequelize, DataTypes);
  var notifications = _notifications(sequelize, DataTypes);
  var points_history = _points_history(sequelize, DataTypes);
  var languages = _languages(sequelize, DataTypes);
  var progression_stages = _progression_stages(sequelize, DataTypes);
  var requirements_evidences = _requirements_evidences(sequelize, DataTypes);
  var rewards = _rewards(sequelize, DataTypes);
  var service_line_leaders = _service_line_leaders(sequelize, DataTypes);
  var service_lines = _service_lines(sequelize, DataTypes);
  var skills = _skills(sequelize, DataTypes);
  var sl_slas = _sl_slas(sequelize, DataTypes);
  var slas = _slas(sequelize, DataTypes);
  var stage_codes = _stage_codes(sequelize, DataTypes);
  var system_announcements = _system_announcements(sequelize, DataTypes);
  var talent_managers = _talent_managers(sequelize, DataTypes);
  var user_account_tokens = _user_account_tokens(sequelize, DataTypes);
  var user_badges_interactions = _user_badges_interactions(sequelize, DataTypes);
  var user_refresh_tokens = _user_refresh_tokens(sequelize, DataTypes);
  var users = _users(sequelize, DataTypes);

  areas.belongsToMany(consultants, { as: 'user_id_consultants', through: consultant_areas, foreignKey: "area_id", otherKey: "user_id" });
  consultants.belongsToMany(areas, { as: 'area_id_areas', through: consultant_areas, foreignKey: "user_id", otherKey: "area_id" });
  consultants.belongsToMany(skills, { as: 'skills_id_skills', through: consultants_selected_skills, foreignKey: "user_id", otherKey: "skills_id" });
  service_lines.belongsToMany(slas, { as: 'sla_id_slas', through: sl_slas, foreignKey: "service_line_id", otherKey: "sla_id" });
  service_lines.belongsToMany(system_announcements, { as: 'announcement_id_system_announcements', through: announc_sl, foreignKey: "service_line_id", otherKey: "announcement_id" });
  skills.belongsToMany(consultants, { as: 'user_id_consultants_consultants_selected_skills', through: consultants_selected_skills, foreignKey: "skills_id", otherKey: "user_id" });
  slas.belongsToMany(service_lines, { as: 'service_line_id_service_lines_sl_slas', through: sl_slas, foreignKey: "sla_id", otherKey: "service_line_id" });
  system_announcements.belongsToMany(service_lines, { as: 'service_line_id_service_lines', through: announc_sl, foreignKey: "announcement_id", otherKey: "service_line_id" });
  areas.belongsTo(administrators, { as: "created_by_administrator", foreignKey: "created_by"});
  administrators.hasMany(areas, { as: "areas", foreignKey: "created_by"});
  areas.belongsTo(administrators, { as: "updated_by_administrator", foreignKey: "updated_by"});
  administrators.hasMany(areas, { as: "updated_by_areas", foreignKey: "updated_by"});
  badge_requirements.belongsTo(administrators, { as: "created_by_administrator", foreignKey: "created_by"});
  administrators.hasMany(badge_requirements, { as: "badge_requirements", foreignKey: "created_by"});
  badge_requirements.belongsTo(administrators, { as: "updated_by_administrator", foreignKey: "updated_by"});
  administrators.hasMany(badge_requirements, { as: "updated_by_badge_requirements", foreignKey: "updated_by"});
  badges.belongsTo(administrators, { as: "created_by_administrator", foreignKey: "created_by"});
  administrators.hasMany(badges, { as: "badges", foreignKey: "created_by"});
  badges.belongsTo(administrators, { as: "updated_by_administrator", foreignKey: "updated_by"});
  administrators.hasMany(badges, { as: "updated_by_badges", foreignKey: "updated_by"});
  gdpr_policies.belongsTo(administrators, { as: "created_by_administrator", foreignKey: "created_by"});
  administrators.hasMany(gdpr_policies, { as: "gdpr_policies", foreignKey: "created_by"});
  gdpr_policies.belongsTo(administrators, { as: "updated_by_administrator", foreignKey: "updated_by"});
  administrators.hasMany(gdpr_policies, { as: "updated_by_gdpr_policies", foreignKey: "updated_by"});
  learning_paths.belongsTo(administrators, { as: "created_by_administrator", foreignKey: "created_by"});
  administrators.hasMany(learning_paths, { as: "learning_paths", foreignKey: "created_by"});
  learning_paths.belongsTo(administrators, { as: "updated_by_administrator", foreignKey: "updated_by"});
  administrators.hasMany(learning_paths, { as: "updated_by_learning_paths", foreignKey: "updated_by"});
  notification_definitions.belongsTo(administrators, { as: "user", foreignKey: "user_id"});
  administrators.hasMany(notification_definitions, { as: "notification_definitions", foreignKey: "user_id"});
  notification_preferences.belongsTo(administrators, { as: "created_by_administrator", foreignKey: "created_by"});
  administrators.hasMany(notification_preferences, { as: "notification_preferences", foreignKey: "created_by"});
  notification_preferences.belongsTo(administrators, { as: "updated_by_administrator", foreignKey: "updated_by"});
  administrators.hasMany(notification_preferences, { as: "updated_by_notification_preferences", foreignKey: "updated_by"});
  progression_stages.belongsTo(administrators, { as: "created_by_administrator", foreignKey: "created_by"});
  administrators.hasMany(progression_stages, { as: "progression_stages", foreignKey: "created_by"});
  progression_stages.belongsTo(administrators, { as: "updated_by_administrator", foreignKey: "updated_by"});
  administrators.hasMany(progression_stages, { as: "updated_by_progression_stages", foreignKey: "updated_by"});
  service_lines.belongsTo(administrators, { as: "created_by_administrator", foreignKey: "created_by"});
  administrators.hasMany(service_lines, { as: "service_lines", foreignKey: "created_by"});
  service_lines.belongsTo(administrators, { as: "updated_by_administrator", foreignKey: "updated_by"});
  administrators.hasMany(service_lines, { as: "updated_by_service_lines", foreignKey: "updated_by"});
  skills.belongsTo(administrators, { as: "created_by_administrator", foreignKey: "created_by"});
  administrators.hasMany(skills, { as: "skills", foreignKey: "created_by"});
  skills.belongsTo(administrators, { as: "updated_by_administrator", foreignKey: "updated_by"});
  administrators.hasMany(skills, { as: "updated_by_skills", foreignKey: "updated_by"});
  slas.belongsTo(administrators, { as: "created_by_administrator", foreignKey: "created_by"});
  administrators.hasMany(slas, { as: "slas", foreignKey: "created_by"});
  slas.belongsTo(administrators, { as: "updated_by_administrator", foreignKey: "updated_by"});
  administrators.hasMany(slas, { as: "updated_by_slas", foreignKey: "updated_by"});
  stage_codes.belongsTo(administrators, { as: "created_by_administrator", foreignKey: "created_by"});
  administrators.hasMany(stage_codes, { as: "stage_codes", foreignKey: "created_by"});
  stage_codes.belongsTo(administrators, { as: "updated_by_administrator", foreignKey: "updated_by"});
  administrators.hasMany(stage_codes, { as: "updated_by_stage_codes", foreignKey: "updated_by"});
  system_announcements.belongsTo(administrators, { as: "created_by_administrator", foreignKey: "created_by"});
  administrators.hasMany(system_announcements, { as: "system_announcements", foreignKey: "created_by"});
  system_announcements.belongsTo(administrators, { as: "updated_by_administrator", foreignKey: "updated_by"});
  administrators.hasMany(system_announcements, { as: "updated_by_system_announcements", foreignKey: "updated_by"});
  users.belongsTo(administrators, { as: "approved_by_administrator", foreignKey: "approved_by"});
  administrators.hasMany(users, { as: "approved_by_users", foreignKey: "approved_by"});
  badges.belongsTo(areas, { as: "area", foreignKey: "area_id"});
  areas.hasMany(badges, { as: "badges", foreignKey: "area_id"});
  consultant_areas.belongsTo(areas, { as: "area", foreignKey: "area_id"});
  areas.hasMany(consultant_areas, { as: "consultant_areas", foreignKey: "area_id"});
  progression_stages.belongsTo(areas, { as: "area", foreignKey: "area_id"});
  areas.hasMany(progression_stages, { as: "progression_stages", foreignKey: "area_id"});
  application_validation_logs.belongsTo(badge_applications, { as: "application", foreignKey: "application_id"});
  badge_applications.hasMany(application_validation_logs, { as: "application_validation_logs", foreignKey: "application_id"});
  awarded_badges.belongsTo(badge_applications, { as: "application", foreignKey: "application_id"});
  badge_applications.hasMany(awarded_badges, { as: "awarded_badges", foreignKey: "application_id"});
  certificates.belongsTo(badge_applications, { as: "application", foreignKey: "application_id"});
  badge_applications.hasMany(certificates, { as: "application_certificates", foreignKey: "application_id"});
  goals.belongsTo(badge_applications, { as: "application", foreignKey: "application_id"});
  badge_applications.hasMany(goals, { as: "application_goals", foreignKey: "application_id"});
  requirements_evidences.belongsTo(badge_applications, { as: "application", foreignKey: "application_id"});
  badge_applications.hasMany(requirements_evidences, { as: "requirements_evidences", foreignKey: "application_id"});
  points_history.belongsTo(badge_requirements, { as: "requirement", foreignKey: "requirement_id"});
  badge_requirements.hasMany(points_history, { as: "points_histories", foreignKey: "requirement_id"});
  requirements_evidences.belongsTo(badge_requirements, { as: "requirement", foreignKey: "requirement_id"});
  badge_requirements.hasMany(requirements_evidences, { as: "requirements_evidences", foreignKey: "requirement_id"});
  badge_applications.belongsTo(badges, { as: "badge", foreignKey: "badge_id"});
  badges.hasMany(badge_applications, { as: "badge_applications", foreignKey: "badge_id"});
  badge_requirements.belongsTo(badges, { as: "badge", foreignKey: "badge_id"});
  badges.hasMany(badge_requirements, { as: "badge_requirements", foreignKey: "badge_id"});
  goals.belongsTo(badges, { as: "badge_badge", foreignKey: "badge_id"});
  badges.hasMany(goals, { as: "badge_goals", foreignKey: "badge_id"});
  points_history.belongsTo(badges, { as: "badge", foreignKey: "badge_id"});
  badges.hasMany(points_history, { as: "points_histories", foreignKey: "badge_id"});
  rewards.belongsTo(badges, { as: "badge", foreignKey: "badge_id"});
  badges.hasMany(rewards, { as: "rewards", foreignKey: "badge_id"});
  skills.belongsTo(badges, { as: "badge", foreignKey: "badge_id"});
  badges.hasMany(skills, { as: "skills", foreignKey: "badge_id"});
  user_badges_interactions.belongsTo(badges, { as: "badge", foreignKey: "badge_id"});
  badges.hasMany(user_badges_interactions, { as: "user_badges_interactions", foreignKey: "badge_id"});
  awarded_badges.belongsTo(consultants, { as: "user", foreignKey: "user_id"});
  consultants.hasMany(awarded_badges, { as: "awarded_badges", foreignKey: "user_id"});
  badge_applications.belongsTo(consultants, { as: "user", foreignKey: "user_id"});
  consultants.hasMany(badge_applications, { as: "badge_applications", foreignKey: "user_id"});
  consultant_areas.belongsTo(consultants, { as: "user", foreignKey: "user_id"});
  consultants.hasMany(consultant_areas, { as: "consultant_areas", foreignKey: "user_id"});
  consultants_selected_skills.belongsTo(consultants, { as: "user", foreignKey: "user_id"});
  consultants.hasMany(consultants_selected_skills, { as: "consultants_selected_skills", foreignKey: "user_id"});
  goals.belongsTo(consultants, { as: "user", foreignKey: "user_id"});
  consultants.hasMany(goals, { as: "goals", foreignKey: "user_id"});
  points_history.belongsTo(consultants, { as: "user", foreignKey: "user_id"});
  consultants.hasMany(points_history, { as: "points_histories", foreignKey: "user_id"});
  badges.belongsTo(learning_paths, { as: "learning_path", foreignKey: "learning_path_id"});
  learning_paths.hasMany(badges, { as: "badges", foreignKey: "learning_path_id"});
  service_lines.belongsTo(learning_paths, { as: "learning_path", foreignKey: "learning_path_id"});
  learning_paths.hasMany(service_lines, { as: "service_lines", foreignKey: "learning_path_id"});
  users.belongsTo(locations, { as: "location", foreignKey: "location_id"});
  locations.hasMany(users, { as: "users", foreignKey: "location_id"});
  notifications.belongsTo(notification_definitions, { as: "definition", foreignKey: "definition_id"});
  notification_definitions.hasMany(notifications, { as: "notifications", foreignKey: "definition_id"});
  slas.belongsTo(notification_definitions, { as: "definition", foreignKey: "definition_id"});
  notification_definitions.hasMany(slas, { as: "slas", foreignKey: "definition_id"});
  notification_preferences.belongsTo(notification_definitions, { as: "definition", foreignKey: "definition_id"});
  notification_definitions.hasMany(notification_preferences, { as: "notification_preferences", foreignKey: "definition_id"});
  users.belongsTo(languages, { as: "language", foreignKey: "language_id"});
  languages.hasMany(users, { as: "users", foreignKey: "language_id"});
  badge_requirements.belongsTo(progression_stages, { as: "progression_stage", foreignKey: "progression_stage_id"});
  progression_stages.hasMany(badge_requirements, { as: "badge_requirements", foreignKey: "progression_stage_id"});
  badges.belongsTo(progression_stages, { as: "progression_stage", foreignKey: "progression_stage_id"});
  progression_stages.hasMany(badges, { as: "badges", foreignKey: "progression_stage_id"});
  announc_sl.belongsTo(service_lines, { as: "service_line", foreignKey: "service_line_id"});
  service_lines.hasMany(announc_sl, { as: "announc_sls", foreignKey: "service_line_id"});
  areas.belongsTo(service_lines, { as: "service_line", foreignKey: "service_line_id"});
  service_lines.hasMany(areas, { as: "areas", foreignKey: "service_line_id"});
  badges.belongsTo(service_lines, { as: "service_line", foreignKey: "service_line_id"});
  service_lines.hasMany(badges, { as: "badges", foreignKey: "service_line_id"});
  service_line_leaders.belongsTo(service_lines, { as: "service_line", foreignKey: "service_line_id"});
  service_lines.hasMany(service_line_leaders, { as: "service_line_leaders", foreignKey: "service_line_id"});
  sl_slas.belongsTo(service_lines, { as: "service_line", foreignKey: "service_line_id"});
  service_lines.hasMany(sl_slas, { as: "sl_slas", foreignKey: "service_line_id"});
  consultants_selected_skills.belongsTo(skills, { as: "skill", foreignKey: "skills_id"});
  skills.hasMany(consultants_selected_skills, { as: "consultants_selected_skills", foreignKey: "skills_id"});
  notification_preferences.belongsTo(slas, { as: "sla", foreignKey: "sla_id"});
  slas.hasMany(notification_preferences, { as: "notification_preferences", foreignKey: "sla_id"});
  sl_slas.belongsTo(slas, { as: "sla", foreignKey: "sla_id"});
  slas.hasMany(sl_slas, { as: "sl_slas", foreignKey: "sla_id"});
  progression_stages.belongsTo(stage_codes, { as: "stage_code", foreignKey: "stage_code_id"});
  stage_codes.hasMany(progression_stages, { as: "progression_stages", foreignKey: "stage_code_id"});
  announc_sl.belongsTo(system_announcements, { as: "announcement", foreignKey: "announcement_id"});
  system_announcements.hasMany(announc_sl, { as: "announc_sls", foreignKey: "announcement_id"});
  notification_preferences.belongsTo(system_announcements, { as: "announcement", foreignKey: "announcement_id"});
  system_announcements.hasMany(notification_preferences, { as: "notification_preferences", foreignKey: "announcement_id"});
  administrators.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasOne(administrators, { as: "administrator", foreignKey: "user_id"});
  application_validation_logs.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(application_validation_logs, { as: "application_validation_logs", foreignKey: "user_id"});
  consultants.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasOne(consultants, { as: "consultant", foreignKey: "user_id"});
  notifications.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(notifications, { as: "notifications", foreignKey: "user_id"});
  service_line_leaders.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasOne(service_line_leaders, { as: "service_line_leader", foreignKey: "user_id"});
  slas.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(slas, { as: "slas", foreignKey: "user_id"});
  system_announcements.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(system_announcements, { as: "system_announcements", foreignKey: "user_id"});
  talent_managers.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasOne(talent_managers, { as: "talent_manager", foreignKey: "user_id"});
  user_badges_interactions.belongsTo(users, { as: "user", foreignKey: "user_id"});
  users.hasMany(user_badges_interactions, { as: "user_badges_interactions", foreignKey: "user_id"});

  return {
    administrators,
    announc_sl,
    application_validation_logs,
    areas,
    awarded_badges,
    badge_applications,
    badge_requirements,
    badges,
    certificates,
    consultant_areas,
    consultants,
    consultants_selected_skills,
    gdpr_policies,
    goals,
    learning_paths,
    locations,
    notification_definitions,
    notification_preferences,
    notifications,
    points_history,
    languages,
    progression_stages,
    requirements_evidences,
    rewards,
    service_line_leaders,
    service_lines,
    skills,
    sl_slas,
    slas,
    stage_codes,
    system_announcements,
    talent_managers,
    user_account_tokens,
    user_badges_interactions,
    user_refresh_tokens,
    users,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
