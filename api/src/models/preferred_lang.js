const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('preferred_lang', {
    preferred_lang_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    preferred_lang: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: "uk_lang_preferred"
    }
  }, {
    sequelize,
    tableName: 'preferred_lang',
    schema: 'public',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "pk_preferred_lang",
        unique: true,
        fields: [
          { name: "preferred_lang_id" },
        ]
      },
      {
        name: "preferred_lang_pk",
        unique: true,
        fields: [
          { name: "preferred_lang_id" },
        ]
      },
      {
        name: "uk_lang_preferred",
        unique: true,
        fields: [
          { name: "preferred_lang" },
        ]
      },
    ]
  });
};
