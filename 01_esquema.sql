

BEGIN;

DROP SCHEMA IF EXISTS rrhh CASCADE;
CREATE SCHEMA rrhh;
COMMENT ON SCHEMA rrhh IS 'Objetos del módulo de Recursos Humanos';

SET search_path TO rrhh;



CREATE TABLE tipo_identificacion (
    id      SMALLINT GENERATED ALWAYS AS IDENTITY,
    codigo  VARCHAR(5)  NOT NULL,
    nombre  VARCHAR(60) NOT NULL,
    activo  BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_tipo_identificacion PRIMARY KEY (id),
    CONSTRAINT uq_tipo_identificacion_codigo UNIQUE (codigo),
    CONSTRAINT uq_tipo_identificacion_nombre UNIQUE (nombre)
);
COMMENT ON TABLE tipo_identificacion IS 'Tipos de documento de identidad (CC, CE, TI, ...)';

CREATE TABLE estado_civil (
    id      SMALLINT GENERATED ALWAYS AS IDENTITY,
    codigo  VARCHAR(5)  NOT NULL,
    nombre  VARCHAR(60) NOT NULL,
    activo  BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_estado_civil PRIMARY KEY (id),
    CONSTRAINT uq_estado_civil_codigo UNIQUE (codigo),
    CONSTRAINT uq_estado_civil_nombre UNIQUE (nombre)
);
COMMENT ON TABLE estado_civil IS 'Estados civiles';

CREATE TABLE sexo (
    id      SMALLINT GENERATED ALWAYS AS IDENTITY,
    codigo  VARCHAR(5)  NOT NULL,
    nombre  VARCHAR(60) NOT NULL,
    activo  BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_sexo PRIMARY KEY (id),
    CONSTRAINT uq_sexo_codigo UNIQUE (codigo),
    CONSTRAINT uq_sexo_nombre UNIQUE (nombre)
);
COMMENT ON TABLE sexo IS 'Sexo';

CREATE TABLE parentesco (
    id      SMALLINT GENERATED ALWAYS AS IDENTITY,
    codigo  VARCHAR(5)  NOT NULL,
    nombre  VARCHAR(60) NOT NULL,
    activo  BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_parentesco PRIMARY KEY (id),
    CONSTRAINT uq_parentesco_codigo UNIQUE (codigo),
    CONSTRAINT uq_parentesco_nombre UNIQUE (nombre)
);
COMMENT ON TABLE parentesco IS 'Rol del familiar dentro del grupo familiar del funcionario';

CREATE TABLE nivel_estudio (
    id      SMALLINT GENERATED ALWAYS AS IDENTITY,
    codigo  VARCHAR(5)  NOT NULL,
    nombre  VARCHAR(60) NOT NULL,
    orden   SMALLINT    NOT NULL,
    activo  BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_nivel_estudio PRIMARY KEY (id),
    CONSTRAINT uq_nivel_estudio_codigo UNIQUE (codigo),
    CONSTRAINT uq_nivel_estudio_nombre UNIQUE (nombre),
    CONSTRAINT ck_nivel_estudio_orden CHECK (orden > 0)
);
COMMENT ON TABLE nivel_estudio IS 'Niveles de formación de educación superior';
COMMENT ON COLUMN nivel_estudio.orden IS 'Jerarquía del nivel (1 = más bajo)';

CREATE TABLE universidad (
    id      INTEGER GENERATED ALWAYS AS IDENTITY,
    nombre  VARCHAR(150) NOT NULL,
    ciudad  VARCHAR(80)  NOT NULL,
    activo  BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_universidad PRIMARY KEY (id),
    CONSTRAINT uq_universidad_nombre UNIQUE (nombre)
);
COMMENT ON TABLE universidad IS 'Instituciones de educación superior';



CREATE TABLE funcionario (
    id                      INTEGER GENERATED ALWAYS AS IDENTITY,
    tipo_identificacion_id  SMALLINT     NOT NULL,
    numero_identificacion   VARCHAR(20)  NOT NULL,
    nombres                 VARCHAR(100) NOT NULL,
    apellidos               VARCHAR(100) NOT NULL,
    estado_civil_id         SMALLINT     NOT NULL,
    sexo_id                 SMALLINT     NOT NULL,
    direccion               VARCHAR(200) NOT NULL,
    telefono                VARCHAR(20)  NOT NULL,
    fecha_nacimiento        DATE         NOT NULL,
    fecha_registro          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_funcionario PRIMARY KEY (id),
    CONSTRAINT uq_funcionario_identificacion UNIQUE (tipo_identificacion_id, numero_identificacion),
    CONSTRAINT fk_funcionario_tipo_identificacion FOREIGN KEY (tipo_identificacion_id)
        REFERENCES tipo_identificacion (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_funcionario_estado_civil FOREIGN KEY (estado_civil_id)
        REFERENCES estado_civil (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_funcionario_sexo FOREIGN KEY (sexo_id)
        REFERENCES sexo (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_funcionario_numero_id CHECK (numero_identificacion ~ '^[A-Za-z0-9]{3,20}$'),
    CONSTRAINT ck_funcionario_nombres   CHECK (btrim(nombres)   <> ''),
    CONSTRAINT ck_funcionario_apellidos CHECK (btrim(apellidos) <> ''),
    CONSTRAINT ck_funcionario_direccion CHECK (btrim(direccion) <> ''),
    CONSTRAINT ck_funcionario_telefono  CHECK (telefono ~ '^\+?[0-9]{7,15}$'),
    CONSTRAINT ck_funcionario_fecha_nac CHECK (fecha_nacimiento BETWEEN DATE '1900-01-01' AND CURRENT_DATE)
);
COMMENT ON TABLE funcionario IS 'Personal que labora en la institución';

CREATE TABLE familiar (
    id                      INTEGER GENERATED ALWAYS AS IDENTITY,
    funcionario_id          INTEGER      NOT NULL,
    parentesco_id           SMALLINT     NOT NULL,
    tipo_identificacion_id  SMALLINT     NOT NULL,
    numero_identificacion   VARCHAR(20)  NOT NULL,
    nombres                 VARCHAR(100) NOT NULL,
    apellidos               VARCHAR(100) NOT NULL,
    sexo_id                 SMALLINT     NOT NULL,
    fecha_nacimiento        DATE         NOT NULL,
    telefono                VARCHAR(20),
    fecha_registro          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_familiar PRIMARY KEY (id),
    CONSTRAINT uq_familiar_funcionario_identificacion
        UNIQUE (funcionario_id, tipo_identificacion_id, numero_identificacion),
    CONSTRAINT fk_familiar_funcionario FOREIGN KEY (funcionario_id)
        REFERENCES funcionario (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_familiar_parentesco FOREIGN KEY (parentesco_id)
        REFERENCES parentesco (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_familiar_tipo_identificacion FOREIGN KEY (tipo_identificacion_id)
        REFERENCES tipo_identificacion (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_familiar_sexo FOREIGN KEY (sexo_id)
        REFERENCES sexo (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_familiar_numero_id CHECK (numero_identificacion ~ '^[A-Za-z0-9]{3,20}$'),
    CONSTRAINT ck_familiar_nombres   CHECK (btrim(nombres)   <> ''),
    CONSTRAINT ck_familiar_apellidos CHECK (btrim(apellidos) <> ''),
    CONSTRAINT ck_familiar_telefono  CHECK (telefono IS NULL OR telefono ~ '^\+?[0-9]{7,15}$'),
    CONSTRAINT ck_familiar_fecha_nac CHECK (fecha_nacimiento BETWEEN DATE '1900-01-01' AND CURRENT_DATE)
);
COMMENT ON TABLE familiar IS 'Miembros del grupo familiar de cada funcionario';

CREATE TABLE formacion_academica (
    id                INTEGER GENERATED ALWAYS AS IDENTITY,
    funcionario_id    INTEGER      NOT NULL,
    universidad_id    INTEGER      NOT NULL,
    nivel_estudio_id  SMALLINT     NOT NULL,
    titulo            VARCHAR(200) NOT NULL,
    fecha_grado       DATE,
    fecha_registro    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_formacion_academica PRIMARY KEY (id),
    CONSTRAINT uq_formacion_academica UNIQUE (funcionario_id, universidad_id, titulo),
    CONSTRAINT fk_formacion_funcionario FOREIGN KEY (funcionario_id)
        REFERENCES funcionario (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_formacion_universidad FOREIGN KEY (universidad_id)
        REFERENCES universidad (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_formacion_nivel_estudio FOREIGN KEY (nivel_estudio_id)
        REFERENCES nivel_estudio (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT ck_formacion_titulo      CHECK (btrim(titulo) <> ''),
    CONSTRAINT ck_formacion_fecha_grado CHECK (fecha_grado IS NULL OR fecha_grado <= CURRENT_DATE)
);
COMMENT ON TABLE formacion_academica IS 'Estudios realizados por cada funcionario';
COMMENT ON COLUMN formacion_academica.fecha_grado IS 'NULL si el estudio está en curso';


CREATE INDEX ix_funcionario_estado_civil   ON funcionario (estado_civil_id);
CREATE INDEX ix_funcionario_sexo           ON funcionario (sexo_id);
CREATE INDEX ix_funcionario_apellidos      ON funcionario (apellidos, nombres);
CREATE INDEX ix_familiar_funcionario       ON familiar (funcionario_id);
CREATE INDEX ix_familiar_parentesco        ON familiar (parentesco_id);
CREATE INDEX ix_familiar_tipo_ident        ON familiar (tipo_identificacion_id);
CREATE INDEX ix_familiar_sexo              ON familiar (sexo_id);
CREATE INDEX ix_formacion_funcionario      ON formacion_academica (funcionario_id);
CREATE INDEX ix_formacion_universidad      ON formacion_academica (universidad_id);
CREATE INDEX ix_formacion_nivel_estudio    ON formacion_academica (nivel_estudio_id);

COMMIT;
