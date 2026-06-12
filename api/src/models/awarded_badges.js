const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('awarded_badges', {
    awarded_badges_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    application_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: "uk_awarded_application",
      references: {
        model: 'badge_applications',
        key: 'application_id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'consultants',
        key: 'user_id'
      }
    },
    awarded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    expiration_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    points_snapshot: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    public_verification_link: {
      type: DataTypes.STRING(512),
      allowNull: true,
      unique: "uk_verification_link"
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    last_expiry_alert_days: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'awarded_badges',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "awarded_badges_pk",
        unique: true,
        fields: [
          { name: "awarded_badges_id" },
        ]
      },
      {
        name: "pk_awarded_badges",
        unique: true,
        fields: [
          { name: "awarded_badges_id" },
        ]
      },
      {
        name: "uk_verification_link",
        unique: true,
        fields: [
          { name: "public_verification_link" },
        ]
      },
      {
        name: "cons_awarded_fk",
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "uk_awarded_application",
        unique: true,
        fields: [
          { name: "application_id" },
        ]
      },
      {
        name: "idx_awarded_user_date",
        fields: [
          { name: "user_id" },
          { name: "awarded_at", order: "DESC" },
        ]
      },
      {
        name: "idx_awarded_expiration",
        fields: [
          { name: "expiration_at" },
        ],
        where: {
          expiration_at: {
            [Sequelize.Op.ne]: null
          }
        }
      },
      {
        name: "idx_awarded_public_featured",
        fields: [
          { name: "is_published" },
          { name: "is_featured" },
        ]
      },
    ]
  });
};
