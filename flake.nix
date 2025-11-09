{
  description = "Ambiente de desenvolvimento backend+frontend";

inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05"; # O principal
    nixpkgs-stable.url = "github:NixOS/nixpkgs/nixos-24.05"; # O estável
  };

  outputs = { self, nixpkgs, nixpkgs-stable }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
      pkgs-stable = import nixpkgs-stable { inherit system; };
		in {
      devShells.${system}.default = pkgs.mkShell {
        nativeBuildInputs = with pkgs; [
          # Backend
          (python3.withPackages (python-pkgs: with python-pkgs; [
            requests
            fastapi
            uvicorn
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
						httpx
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
          openssl
        ] ++ (with pkgs-stable; [
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
        ]);
      shellHook = ''
				# export WEBKIT_DISABLE_COMPOSITING_MODE=1
				#export WEBKIT_DISABLE_DMABUF_RENDERER=1
				#export GDK_BACKEND=x11
				#export WEBKIT_FORCE_WAYLAND=1
				export SHELL=$(which zsh)
				exec zsh
      '';
      };
    };
}

