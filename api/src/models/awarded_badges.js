const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
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
    ]
  });
};
