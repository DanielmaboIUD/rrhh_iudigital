BEGIN;

SET search_path TO rrhh;


CREATE TABLE rol (
    id           SMALLINT GENERATED ALWAYS AS IDENTITY,
    codigo       VARCHAR(20)  NOT NULL,
    nombre       VARCHAR(60)  NOT NULL,
    descripcion  VARCHAR(200) NOT NULL,
    CONSTRAINT pk_rol PRIMARY KEY (id),
    CONSTRAINT uq_rol_codigo UNIQUE (codigo),
    CONSTRAINT uq_rol_nombre UNIQUE (nombre)
);
COMMENT ON TABLE rol IS 'Roles de acceso al sistema';
COMMENT ON COLUMN rol.codigo IS 'Identificador estable usado por el backend para autorizar';

INSERT INTO rol (codigo, nombre, descripcion) VALUES
    ('ADMIN',       'Administrador', 'Acceso total, incluida la gestión de usuarios'),
    ('RRHH',        'Recursos Humanos', 'Consulta, crea y edita la información de RRHH'),
    ('CONSULTA',    'Consulta', 'Solo lectura de la información de RRHH'),
    ('FUNCIONARIO', 'Funcionario', 'Gestiona únicamente su propia información');

CREATE TABLE usuario (
    id                 INTEGER GENERATED ALWAYS AS IDENTITY,
    nombre_usuario     VARCHAR(50)  NOT NULL,
    contrasena_hash    VARCHAR(100) NOT NULL,
    rol_id             SMALLINT     NOT NULL,
    funcionario_id     INTEGER,
    activo             BOOLEAN      NOT NULL DEFAULT TRUE,
    intentos_fallidos  SMALLINT     NOT NULL DEFAULT 0,
    bloqueado_hasta    TIMESTAMP,
    ultimo_acceso      TIMESTAMP,
    fecha_registro     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_usuario PRIMARY KEY (id),
    CONSTRAINT uq_usuario_nombre_usuario UNIQUE (nombre_usuario),
    CONSTRAINT uq_usuario_funcionario UNIQUE (funcionario_id),
    CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id)
        REFERENCES rol (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_usuario_funcionario FOREIGN KEY (funcionario_id)
        REFERENCES funcionario (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT ck_usuario_nombre_usuario CHECK (nombre_usuario ~ '^[a-z0-9._-]{4,50}$'),
    CONSTRAINT ck_usuario_intentos CHECK (intentos_fallidos >= 0)
);
COMMENT ON TABLE usuario IS 'Cuentas de acceso. El rol FUNCIONARIO exige funcionario_id; la regla se valida en el backend';
COMMENT ON COLUMN usuario.contrasena_hash IS 'Hash bcrypt; la contraseña en claro nunca se guarda';
COMMENT ON COLUMN usuario.funcionario_id IS 'Funcionario enlazado a la cuenta, si lo hay';
COMMENT ON COLUMN usuario.intentos_fallidos IS 'Intentos de login fallidos consecutivos';
COMMENT ON COLUMN usuario.bloqueado_hasta IS 'NULL si la cuenta no está bloqueada';

CREATE TABLE refresh_token (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY,
    usuario_id          INTEGER   NOT NULL,
    token_hash          CHAR(64)  NOT NULL,
    expira_en           TIMESTAMP NOT NULL,
    creado_en           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revocado_en         TIMESTAMP,
    reemplazado_por_id  BIGINT,
    CONSTRAINT pk_refresh_token PRIMARY KEY (id),
    CONSTRAINT uq_refresh_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_token_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuario (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_refresh_token_reemplazo FOREIGN KEY (reemplazado_por_id)
        REFERENCES refresh_token (id) ON DELETE SET NULL
);
COMMENT ON TABLE refresh_token IS 'Refresh tokens emitidos, conservados tras revocarse para detectar reutilización';
COMMENT ON COLUMN refresh_token.token_hash IS 'SHA-256 en hexadecimal; el token en claro nunca se guarda';
COMMENT ON COLUMN refresh_token.revocado_en IS 'NULL si el token sigue vigente';
COMMENT ON COLUMN refresh_token.reemplazado_por_id IS 'Token que lo sustituyó al rotar';


CREATE INDEX ix_usuario_rol            ON usuario (rol_id);
CREATE INDEX ix_refresh_token_usuario  ON refresh_token (usuario_id);

COMMIT;
