const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('languages', {
    language_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    language_iso: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: "uk_lang_preferred"
    },
    language_name: {
      type: DataTypes.STRING(128),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'languages',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "pk_languages",
        unique: true,
        fields: [
          { name: "language_id" },
        ]
      },
      {
        name: "languages_pk",
        unique: true,
        fields: [
          { name: "language_id" },
        ]
      },
      {
        name: "uk_lang_preferred",
        unique: true,
        fields: [
          { name: "language_iso" },
        ]
      },
    ]
  });
};
