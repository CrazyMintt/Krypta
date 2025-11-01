{
  description = "Ambiente de desenvolvimento backend+frontend";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05"; # ou sua versão preferida
  };

  outputs = { self, nixpkgs }: 
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
    in {
      devShells.${system}.default = pkgs.mkShell {
        nativeBuildInputs = with pkgs; [
          # Backend
          (python3.withPackages (python-pkgs: with python-pkgs; [
            requests
            fastapi
            "uvicorn[standard]"
            sqlalchemy
            python-dotenv
            pymysql
            email-validator
            python-jose
            passlib
            pydantic-settings
            python-multipart
            argon2-cffi
						pydantic-extra-types
          ]))
          
          # Frontend
          rustc
          cargo
          pkg-config
          gobject-introspection
          nodejs
          cargo-tauri
        ];

        buildInputs = with pkgs; [
          at-spi2-atk
          atkmm
          cairo
          gdk-pixbuf
          glib
          gtk3
          harfbuzz
          librsvg
          libsoup_3
          pango
          webkitgtk_4_1
          openssl
        ];
      shellHook = ''
				export WEBKIT_DISABLE_COMPOSITING_MODE=1
				export SHELL=$(which zsh)
				exec zsh
      '';
      };
    };
}

