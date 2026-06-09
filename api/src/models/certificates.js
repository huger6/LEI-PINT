const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('certificates', {
    certificate_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    application_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: "uk_certificate_application",
      references: {
        model: 'badge_applications',
        key: 'application_id'
      }
    },
    certificate_title: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    issuing_entity: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    issue_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    certificate_file_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    language_code: {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'certificates',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "certificates_pk",
        unique: true,
        fields: [
          { name: "certificate_id" },
        ]
      },
      {
        name: "pk_certificates",
        unique: true,
        fields: [
          { name: "certificate_id" },
        ]
      },
      {
        name: "uk_certificate_application",
        unique: true,
        fields: [
          { name: "application_id" },
        ]
      },
    ]
  });
};
