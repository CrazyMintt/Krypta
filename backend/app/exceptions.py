class UserNotFoundError(Exception):
    """Lançada quando um usuário não é encontrado no banco de dados."""

    pass


class EmailAlreadyExistsError(Exception):
    """Lançada quando uma tentativa de criar/atualizar um usuário falha por email duplicado."""

    pass


class DataNotFoundError(Exception):
    """Lançada quando um Dado não é encontrado ou não pertence ao usuário."""

    pass


class SeparatorNameTakenError(Exception):
    """Lançada ao tentar criar uma Pasta ou Tag com um nome que já existe para aquele tipo."""

    pass


class DuplicateDataError(Exception):
    """Lançada ao tentar criar um Dado que viola uma regra de unicidade."""

    pass


class StorageLimitExceededError(Exception):
    """Lançada quando uma operação excede o limite de armazenamento do usuário."""

    pass


class AuthenticationError(Exception):
    """Lançada quando a autenticação (email/senha) falha."""

    pass
