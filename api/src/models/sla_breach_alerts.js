const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('sla_breach_alerts', {
    alert_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    sla_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'slas',
        key: 'sla_id'
      }
    },
    application_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'badge_applications',
        key: 'application_id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    alerted_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'sla_breach_alerts',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "pk_sla_breach_alerts",
        unique: true,
        fields: [
          { name: "alert_id" },
        ]
      },
      {
        name: "sla_breach_alerts_pk",
        unique: true,
        fields: [
          { name: "alert_id" },
        ]
      },
    ]
  });
};
