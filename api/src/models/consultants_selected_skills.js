const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('consultants_selected_skills', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'consultants',
        key: 'user_id'
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
    tableName: 'consultants_selected_skills',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "consultants_selected_skills_pk",
        unique: true,
        fields: [
          { name: "user_id" },
          { name: "skills_id" },
        ]
      },
      {
        name: "pk_consultants_selected_skills",
        unique: true,
        fields: [
          { name: "user_id" },
          { name: "skills_id" },
        ]
      },
    ]
  });
};
