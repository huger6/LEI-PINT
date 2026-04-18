const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('requirements_evidences', {
    evidence_id: {
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
      },
      unique: "uk_one_evidence_per_req"
    },
    requirement_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'badge_requirements',
        key: 'requirement_id'
      },
      unique: "uk_one_evidence_per_req"
    },
    evidence_file_url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    evidence_title: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    evidence_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    evidence_file_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    tm_reviewed: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    sll_reviewed: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    uploaded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    }
  }, {
    sequelize,
    tableName: 'requirements_evidences',
    schema: 'public',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: "pk_requirements_evidences",
        unique: true,
        fields: [
          { name: "evidence_id" },
        ]
      },
      {
        name: "requirements_evidences_pk",
        unique: true,
        fields: [
          { name: "evidence_id" },
        ]
      },
      {
        name: "uk_one_evidence_per_req",
        unique: true,
        fields: [
          { name: "application_id" },
          { name: "requirement_id" },
        ]
      },
    ]
  });
};
