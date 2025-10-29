class UserNotFoundError(Exception):
    """Lançada quando um usuário não é encontrado no banco de dados."""

    pass


class EmailAlreadyExistsError(Exception):
    """Lançada quando uma tentativa de criar/atualizar um usuário falha por email duplicado."""

    pass


class DataNotFoundError(Exception):
    """Lançada quando um Dado não é encontrado ou não pertence ao usuário."""

    pass
