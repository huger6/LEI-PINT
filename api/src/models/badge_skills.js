const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('badge_skills', {
    badge_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'badges',
        key: 'badge_id'
      }
    },
    skills_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'skills',
        key: 'skills_id'
      }
    }
  }, {
    sequelize,
    tableName: 'badge_skills',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "badge_skills_pk",
        unique: true,
        fields: [
          { name: "badge_id" },
          { name: "skills_id" },
        ]
      },
      {
        name: "pk_badge_skills",
        unique: true,
        fields: [
          { name: "badge_id" },
          { name: "skills_id" },
        ]
      },
    ]
  });
};
