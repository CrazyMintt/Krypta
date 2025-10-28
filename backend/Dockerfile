FROM python:3.12-slim
WORKDIR /backend

# Copia o requirements.txt primeiro para aproveitar o cache do Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


# Informa ao Docker que a aplicação rodará na porta 8000
EXPOSE 8000
