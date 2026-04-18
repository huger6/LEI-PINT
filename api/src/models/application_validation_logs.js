const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('application_validation_logs', {
    validation_log_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    application_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'badge_applications',
        key: 'application_id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    validator_function: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    validator_action: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    validations_comments: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    validated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'application_validation_logs',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "application_validation_logs_pk",
        unique: true,
        fields: [
          { name: "validation_log_id" },
        ]
      },
      {
        name: "pk_application_validation_logs",
        unique: true,
        fields: [
          { name: "validation_log_id" },
        ]
      },
      {
        name: "applications_validations_fk",
        fields: [
          { name: "application_id" },
        ]
      },
      {
        name: "users_validations_fk",
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "idx_validation_logs_app",
        fields: [
          { name: "application_id" },
          { name: "validated_at" },
        ]
      },
    ]
  });
};
