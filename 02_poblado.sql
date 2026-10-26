

BEGIN;

SET search_path TO rrhh;


INSERT INTO tipo_identificacion (codigo, nombre) VALUES
    ('CC',  'Cédula de ciudadanía'),
    ('CE',  'Cédula de extranjería'),
    ('TI',  'Tarjeta de identidad'),
    ('RC',  'Registro civil de nacimiento'),
    ('PA',  'Pasaporte'),
    ('PPT', 'Permiso por protección temporal');

INSERT INTO estado_civil (codigo, nombre) VALUES
    ('S',  'Soltero(a)'),
    ('C',  'Casado(a)'),
    ('UL', 'Unión marital de hecho'),
    ('SE', 'Separado(a)'),
    ('D',  'Divorciado(a)'),
    ('V',  'Viudo(a)');

INSERT INTO sexo (codigo, nombre) VALUES
    ('M', 'Masculino'),
    ('F', 'Femenino'),
    ('I', 'Intersexual');

INSERT INTO parentesco (codigo, nombre) VALUES
    ('CON', 'Cónyuge'),
    ('COM', 'Compañero(a) permanente'),
    ('HIJ', 'Hijo(a)'),
    ('PAD', 'Padre'),
    ('MAD', 'Madre'),
    ('HER', 'Hermano(a)'),
    ('OTR', 'Otro');

INSERT INTO nivel_estudio (codigo, nombre, orden) VALUES
    ('TP',  'Técnico profesional',      1),
    ('TEC', 'Tecnológico',              2),
    ('PRO', 'Profesional universitario',3),
    ('ESP', 'Especialización',          4),
    ('MAE', 'Maestría',                 5),
    ('DOC', 'Doctorado',                6);

INSERT INTO universidad (nombre, ciudad) VALUES
    ('Institución Universitaria Digital de Antioquia',          'Medellín'),
    ('Universidad de Antioquia',                                'Medellín'),
    ('Universidad Nacional de Colombia',                        'Medellín'),
    ('Universidad EAFIT',                                       'Medellín'),
    ('Universidad Pontificia Bolivariana',                      'Medellín'),
    ('Instituto Tecnológico Metropolitano',                     'Medellín'),
    ('Politécnico Colombiano Jaime Isaza Cadavid',              'Medellín'),
    ('Universidad de Medellín',                                 'Medellín');


INSERT INTO funcionario (tipo_identificacion_id, numero_identificacion, nombres, apellidos,
                         estado_civil_id, sexo_id, direccion, telefono, fecha_nacimiento)
SELECT ti.id, v.numero, v.nombres, v.apellidos, ec.id, s.id, v.direccion, v.telefono, v.fecha_nac
FROM (VALUES
    ('CC', '1000000001', 'Laura Marcela',  'Gómez Restrepo',  'C',  'F', 'Calle 10 # 43-20, Medellín',     '3001234567', DATE '1985-03-14'),
    ('CC', '1000000002', 'Carlos Andrés',  'Pérez Zapata',    'S',  'M', 'Carrera 70 # 45-12, Medellín',   '3017654321', DATE '1992-07-22'),
    ('CC', '1000000003', 'Diana Patricia', 'Ramírez Ochoa',   'UL', 'F', 'Calle 50 # 80-15, Bello',        '3109876543', DATE '1988-11-05'),
    ('CE', 'E00456789',  'Miguel Ángel',   'Torres Díaz',     'C',  'M', 'Carrera 43A # 1-50, Envigado',   '3204567890', DATE '1979-01-30'),
    ('CC', '1000000005', 'Sandra Milena',  'Castaño Vélez',   'V',  'F', 'Calle 33 # 65-40, Itagüí',       '3156543210', DATE '1975-09-18')
) AS v(tipo, numero, nombres, apellidos, est_civil, sexo, direccion, telefono, fecha_nac)
JOIN tipo_identificacion ti ON ti.codigo = v.tipo
JOIN estado_civil       ec ON ec.codigo = v.est_civil
JOIN sexo                s ON s.codigo  = v.sexo;


INSERT INTO familiar (funcionario_id, parentesco_id, tipo_identificacion_id, numero_identificacion,
                      nombres, apellidos, sexo_id, fecha_nacimiento, telefono)
SELECT f.id, p.id, ti.id, v.numero, v.nombres, v.apellidos, s.id, v.fecha_nac, v.telefono
FROM (VALUES
    ('1000000001', 'CON', 'CC', '1000000101', 'Jorge Iván',  'Mejía Arango',     'M', DATE '1983-06-10', '3005551111'),
    ('1000000001', 'HIJ', 'TI', '1100000102', 'Sofía',       'Mejía Gómez',      'F', DATE '2012-04-02', NULL),
    ('1000000001', 'HIJ', 'RC', '1100000103', 'Tomás',       'Mejía Gómez',      'M', DATE '2018-12-20', NULL),
    ('1000000002', 'MAD', 'CC', '1000000201', 'Gloria Inés', 'Zapata Londoño',   'F', DATE '1965-02-14', '3045552222'),
    ('1000000003', 'COM', 'CC', '1000000301', 'Andrés Felipe','Montoya Ríos',    'M', DATE '1987-08-25', '3125553333'),
    ('1000000003', 'HIJ', 'RC', '1100000302', 'Valentina',   'Montoya Ramírez',  'F', DATE '2020-05-11', NULL),
    ('E00456789',  'CON', 'CC', '1000000401', 'Paula Andrea','Henao Cardona',    'F', DATE '1981-10-03', '3185554444'),
    ('E00456789',  'HIJ', 'TI', '1100000402', 'Samuel',      'Torres Henao',     'M', DATE '2010-03-29', NULL),
    ('1000000005', 'HIJ', 'CC', '1000000501', 'Juan David',  'Salazar Castaño',  'M', DATE '2000-07-07', '3215555555'),
    ('1000000005', 'HER', 'CC', '1000000502', 'Beatriz Elena','Castaño Vélez',   'F', DATE '1972-12-01', '3005556666')
) AS v(func_numero, parentesco, tipo, numero, nombres, apellidos, sexo, fecha_nac, telefono)
JOIN funcionario         f ON f.numero_identificacion = v.func_numero
JOIN parentesco          p ON p.codigo  = v.parentesco
JOIN tipo_identificacion ti ON ti.codigo = v.tipo
JOIN sexo                s ON s.codigo  = v.sexo;

INSERT INTO formacion_academica (funcionario_id, universidad_id, nivel_estudio_id, titulo, fecha_grado)
SELECT f.id, u.id, n.id, v.titulo, v.fecha_grado
FROM (VALUES
    ('1000000001', 'Universidad de Antioquia',                       'PRO', 'Psicóloga',                                    DATE '2008-12-12'),
    ('1000000001', 'Universidad EAFIT',                              'ESP', 'Especialista en Gestión Humana',               DATE '2012-06-15'),
    ('1000000002', 'Institución Universitaria Digital de Antioquia', 'TEC', 'Tecnólogo en Desarrollo de Software',          DATE '2016-11-30'),
    ('1000000002', 'Institución Universitaria Digital de Antioquia', 'PRO', 'Ingeniero de Software y Datos',                NULL),
    ('1000000003', 'Universidad de Medellín',                        'PRO', 'Contadora Pública',                            DATE '2011-07-01'),
    ('E00456789',  'Universidad Nacional de Colombia',               'PRO', 'Ingeniero de Sistemas e Informática',          DATE '2003-03-20'),
    ('E00456789',  'Universidad Pontificia Bolivariana',             'MAE', 'Magíster en Ingeniería',                       DATE '2009-09-10'),
    ('1000000005', 'Politécnico Colombiano Jaime Isaza Cadavid',     'TP',  'Técnico Profesional en Secretariado',          DATE '1996-12-05'),
    ('1000000005', 'Instituto Tecnológico Metropolitano',            'TEC', 'Tecnóloga en Gestión Administrativa',          DATE '2005-06-24')
) AS v(func_numero, universidad, nivel, titulo, fecha_grado)
JOIN funcionario   f ON f.numero_identificacion = v.func_numero
JOIN universidad   u ON u.nombre = v.universidad
JOIN nivel_estudio n ON n.codigo = v.nivel;

COMMIT;

SELECT 'tipo_identificacion' AS tabla, COUNT(*) AS registros FROM rrhh.tipo_identificacion
UNION ALL SELECT 'estado_civil',        COUNT(*) FROM rrhh.estado_civil
UNION ALL SELECT 'sexo',                COUNT(*) FROM rrhh.sexo
UNION ALL SELECT 'parentesco',          COUNT(*) FROM rrhh.parentesco
UNION ALL SELECT 'nivel_estudio',       COUNT(*) FROM rrhh.nivel_estudio
UNION ALL SELECT 'universidad',         COUNT(*) FROM rrhh.universidad
UNION ALL SELECT 'funcionario',         COUNT(*) FROM rrhh.funcionario
UNION ALL SELECT 'familiar',            COUNT(*) FROM rrhh.familiar
UNION ALL SELECT 'formacion_academica', COUNT(*) FROM rrhh.formacion_academica;
