const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('talent_managers', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    biography: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    interaction_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'talent_managers',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "pk_talent_managers",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
      {
        name: "talent_managers_pk",
        unique: true,
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
};
