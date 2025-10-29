let
  pkgs = import <nixpkgs> { 
    config = {
      substituters = [
        "https://cache.nixos.org"
        "https://nix-community.cachix.org"
      ];
      trusted-public-keys = [
        "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
        "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
      ];
    };
  };
in
pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    # Backend
    (pkgs.python3.withPackages 
      (python-pkgs: with python-pkgs; 
        [
          requests
          fastapi[standard]
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
	]
      )
    )
    
    # Frontend
    rustc
    pkg-config
    gobject-introspection
    cargo 
    cargo-tauri # Optional, Only needed if Tauri doesn't work through the traditional way.
    nodejs # Optional, this is for if you have a js frontend
  ];

  buildInputs = with pkgs;[
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
  # shellHook = "";
}
